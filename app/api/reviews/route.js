import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, rating, title, body } = await request.json();

    if (!productId || !rating || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) return new Response('Invalid rating', {status: 400});

    // Check if the user already reviewed this product
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    // Wrap in a transaction to update product aggregates
    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          rating: parseInt(rating),
          title: title || null,
          body,
          userId: session.user.id,
          productId,
        },
        include: { user: { select: { name: true } } },
      });

      // Recalculate average rating
      const aggregates = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { id: true },
      });

      const totalReviews = aggregates._count.id;
      const avgRating = aggregates._avg.rating ? aggregates._avg.rating.toFixed(1) : 0;

      await tx.product.update({
        where: { id: productId },
        data: {
          rating: parseFloat(avgRating),
          reviewCount: totalReviews,
        },
      });

      return review;
    });

    return NextResponse.json({ review: result }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/reviews]', error);
    return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
  }
}
