import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createPaymentIntent } from '@/lib/payment';
import { auth } from '@/lib/auth';
import { calculateShipping, calculateTax } from '@/lib/utils';
import { rateLimiter, getIp } from '@/lib/rate-limit';

// POST /api/checkout — initialize Stripe payment intent
export async function POST(request) {
  try {
    const ip = getIp(request);
    const rateLimit = await rateLimiter.check(ip, 10, 3600000); // 10 checkouts per hour
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many checkout attempts. Please try again later.' }, { status: 429 });
    }

    const session = await auth();
    const body = await request.json();
    const guestEmail = body?.guestEmail;
    
    if (!session?.user && !guestEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = body?.items;
    const orderId = body?.orderId;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    let subtotalCents = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 400 });
      }
      if (product.stock <= 0 || product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
      }
      subtotalCents += Math.round(product.price * 100) * item.quantity;
    }

    const subtotal = subtotalCents / 100;
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);
    const total = subtotal + shipping + tax;

    if (total <= 0) {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
    }

    // Create a Stripe Payment Intent
    // Once you add your Stripe keys to .env, real payments are processed here
    const { clientSecret, paymentIntentId } = await createPaymentIntent(total, 'usd', {
      userId: session?.user?.id || 'guest',
      userEmail: session?.user?.email || guestEmail,
      orderId: orderId || '',
      itemCount: String(items.length),
    });

    return NextResponse.json({ clientSecret, paymentIntentId, calculatedTotal: total });
  } catch (error) {
    console.error('[POST /api/checkout]', error);
    return NextResponse.json({ error: 'Payment initialization failed. Please try again.' }, { status: 500 });
  }
}
