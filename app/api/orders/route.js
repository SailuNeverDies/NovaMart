import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { rateLimiter, getIp } from '@/lib/rate-limit';
import { verifyPayment } from '@/lib/payment';
import { calculateShipping, calculateTax } from '@/lib/utils';
import crypto from 'crypto';

// GET /api/orders — user's order history
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: { include: { images: { take: 1 } } } },
        },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[GET /api/orders]', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders — place a new order
export async function POST(request) {
  try {
    // 1. Rate Limiting
    const ip = getIp(request);
    const rateLimit = await rateLimiter.check(ip, 5, 60000); // 5 orders per minute
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many order attempts. Please try again later.' }, { status: 429 });
    }

    const session = await auth();
    const body = await request.json();
    const { items, shippingAddress, paymentIntentId, guestEmail } = body;

    // 2. Authentication / Guest Email Validation
    if (!session?.user?.id) {
      if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        return NextResponse.json({ error: 'Unauthorized. Must be logged in or provide a valid guest email.' }, { status: 401 });
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }
    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    // 3. Idempotency Check
    const idempotencyKey = request.headers.get('x-idempotency-key') || null;
    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({ where: { idempotencyKey } });
      if (existingOrder) {
        return NextResponse.json({ order: existingOrder }, { status: 200 }); // Return existing to prevent duplicate creation
      }
    }
    if (paymentIntentId) {
      const existingOrder = await prisma.order.findFirst({ where: { paymentIntentId } });
      if (existingOrder) {
        return NextResponse.json({ order: existingOrder }, { status: 200 }); // Return existing to prevent duplicate creation
      }
    }

    // 4. Server-Side Price Calculation (Pre-Transaction)
    let subtotalCents = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
      }
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return NextResponse.json({ error: `Product not found: ${item.name || item.productId}` }, { status: 400 });
      if (product.stock < item.quantity) return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });

      subtotalCents += Math.round(product.price * 100) * item.quantity;
      validatedItems.push({
        quantity: item.quantity,
        price: product.price, // Trust server price
        name: product.name,   // Trust server name
        productId: product.id,
      });
    }

    const calculatedSubtotal = subtotalCents / 100;
    const calculatedShipping = calculateShipping(calculatedSubtotal);
    const calculatedTax = calculateTax(calculatedSubtotal);
    const calculatedTotal = calculatedSubtotal + calculatedShipping + calculatedTax;

    // 5. Stripe Server-Side Verification
    let isPaid = false;
    if (paymentIntentId) {
      try {
        const stripeVerification = await verifyPayment(paymentIntentId);
        if (stripeVerification.success) {
          isPaid = true;
          // Verify amount matches
          if (Math.abs(stripeVerification.amount - calculatedTotal) > 0.05) {
             console.error(`Amount mismatch: Stripe ${stripeVerification.amount} vs Calc ${calculatedTotal}`);
             return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
          }
        } else {
          return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
        }
      } catch (stripeErr) {
        if (process.env.NODE_ENV === 'production') {
           return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }
        // In dev with demo mode, allow it if it fails to verify (since there are no real keys)
      }
    }

    // Generate secure order number
    const year = new Date().getFullYear();
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    const orderNumber = `NM-${year}-${rand}`;

    try {
      // 6. Create order + items in a transaction securely
      const order = await prisma.$transaction(async (tx) => {
        // Re-verify stock lock
        for (const item of validatedItems) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
        }

        // Create order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            status: isPaid ? 'PAID' : 'PENDING',
            subtotal: calculatedSubtotal,
            shippingCost: calculatedShipping,
            tax: calculatedTax,
            total: calculatedTotal,
            paymentIntentId: paymentIntentId || null,
            paymentStatus: isPaid ? 'paid' : 'unpaid',
            idempotencyKey,
            userId: session?.user?.id || null,
            guestEmail: guestEmail || null,
            shippingName: shippingAddress.fullName,
            shippingPhone: shippingAddress.phone,
            shippingStreet: shippingAddress.street,
            shippingCity: shippingAddress.city,
            shippingState: shippingAddress.state,
            shippingZip: shippingAddress.zip,
            shippingCountry: shippingAddress.country || 'US',
            items: {
              create: validatedItems,
            },
          },
          include: { items: true },
        });

        // Deduct stock securely using atomic updateMany
        for (const item of validatedItems) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
        }

        // Clear user's cart if authenticated
        if (session?.user?.id) {
          await tx.cartItem.deleteMany({ where: { userId: session.user.id } });
        }

        return newOrder;
      });

      return NextResponse.json({ order }, { status: 201 });
    } catch (txError) {
      if (txError.message.includes('not found') || txError.message.includes('Insufficient stock')) {
        return NextResponse.json({ error: txError.message }, { status: 400 });
      }
      throw txError;
    }
  } catch (error) {
    console.error('[POST /api/orders]', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
