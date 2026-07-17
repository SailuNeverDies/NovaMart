import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/wishlist — return current user's wishlist product IDs
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      select: { productId: true },
    });

    return NextResponse.json({ ids: items.map((i) => i.productId) });
  } catch (error) {
    console.error('[GET /api/wishlist]', error);
    return NextResponse.json({ ids: [] }, { status: 500 });
  }
}

// POST /api/wishlist — toggle a product in/out of the wishlist
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });

    if (existing) {
      // Remove from wishlist
      await prisma.wishlistItem.delete({
        where: { userId_productId: { userId: session.user.id, productId } },
      });
      return NextResponse.json({ wishlisted: false });
    } else {
      // Add to wishlist
      await prisma.wishlistItem.create({
        data: { userId: session.user.id, productId },
      });
      return NextResponse.json({ wishlisted: true });
    }
  } catch (error) {
    console.error('[POST /api/wishlist]', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
