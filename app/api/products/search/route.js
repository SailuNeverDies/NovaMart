import { NextResponse } from 'next/server';
import { meiliAdmin, PRODUCTS_INDEX } from '@/lib/meilisearch';
import prisma from '@/lib/prisma';

// GET /api/products/search?q=... — autocomplete suggestions
// Now powered by Meilisearch for typo-tolerance and sub-50ms response.
// Falls back to Prisma if Meilisearch is unavailable.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    try {
      // ── Meilisearch path ──────────────────────────────────────────────────
      const { hits } = await meiliAdmin.index(PRODUCTS_INDEX).search(q, {
        filter: ['stock > 0'],
        limit: 6,
        attributesToRetrieve: [
          'id', 'name', 'slug', 'price', 'comparePrice',
          'category', 'categoryName', 'image', 'imageAlt',
        ],
      });

      // Reshape hits to match the existing response shape the Navbar expects
      const results = hits.map((h) => ({
        id:           h.id,
        name:         h.name,
        slug:         h.slug,
        price:        h.price,
        comparePrice: h.comparePrice,
        category:     { name: h.categoryName },
        images:       h.image ? [{ url: h.image, alt: h.imageAlt }] : [],
      }));

      return NextResponse.json({ results });

    } catch (meiliError) {
      // ── Prisma fallback (if Meilisearch is down) ──────────────────────────
      console.warn('[Search] Meilisearch unavailable, falling back to Prisma:', meiliError.message);

      const products = await prisma.product.findMany({
        where: {
          stock: { gt: 0 },
          OR: [
            { name: { contains: q } },
            { brand: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        take: 6,
        select: {
          id: true,
          name: true,
          price: true,
          comparePrice: true,
          slug: true,
          category: { select: { name: true } },
          images: { take: 1, orderBy: { order: 'asc' }, select: { url: true, alt: true } },
        },
        orderBy: { reviewCount: 'desc' },
      });

      return NextResponse.json({ results: products });
    }

  } catch (error) {
    console.error('[GET /api/products/search]', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
