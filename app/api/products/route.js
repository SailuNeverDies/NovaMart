import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { meiliAdmin, PRODUCTS_INDEX, flattenProduct, syncProductToMeili } from '@/lib/meilisearch';

// GET /api/products — list & search products
// When ?search= is present → Meilisearch (typo-tolerant, ranked)
// Filter-only queries (no search text) → Prisma (fast structured queries)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search    = searchParams.get('search') || '';
    const category  = searchParams.get('category') || '';
    const sort      = searchParams.get('sort') || 'newest';
    const minPrice  = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice  = parseFloat(searchParams.get('maxPrice') || '999999');
    const featured  = searchParams.get('featured') === 'true';
    const inStock   = searchParams.get('inStock') === '1';
    const page      = parseInt(searchParams.get('page') || '1');
    const rawLimit  = parseInt(searchParams.get('limit'));
    const limit     = isNaN(rawLimit) ? 12 : Math.max(1, Math.min(rawLimit, 100));

    // ── Meilisearch path (when full-text search is requested) ──────────────
    if (search) {
      try {
        // Build Meilisearch filter array
        const filters = [];
        if (category)        filters.push(`category = "${category.replace(/"/g, '\\"')}"`);
        if (featured)        filters.push('featured = true');
        if (inStock)         filters.push('stock > 0');
        if (minPrice > 0)    filters.push(`price >= ${minPrice}`);
        if (maxPrice < 999999) filters.push(`price <= ${maxPrice}`);

        // Map sort param to Meilisearch sort expression
        const sortMap = {
          'newest':     ['createdAt:desc'],
          'oldest':     ['createdAt:asc'],
          'price-asc':  ['price:asc'],
          'price-desc': ['price:desc'],
          'rating':     ['rating:desc'],
          'popular':    ['reviewCount:desc'],
        };

        const { hits, estimatedTotalHits } = await meiliAdmin
          .index(PRODUCTS_INDEX)
          .search(search, {
            filter:    filters.length ? filters.join(' AND ') : undefined,
            sort:      sortMap[sort] || ['createdAt:desc'],
            limit,
            offset:    (page - 1) * limit,
            attributesToRetrieve: [
              'id', 'name', 'slug', 'description', 'price', 'comparePrice',
              'stock', 'featured', 'rating', 'reviewCount', 'brand', 'tags',
              'category', 'categoryName', 'image', 'imageAlt', 'createdAt',
            ],
          });

        // Reshape Meilisearch hits to match the response shape the frontend expects
        const products = hits.map((h) => ({
          id:           h.id,
          name:         h.name,
          slug:         h.slug,
          description:  h.description,
          price:        h.price,
          comparePrice: h.comparePrice,
          stock:        h.stock,
          featured:     h.featured,
          rating:       h.rating,
          reviewCount:  h.reviewCount,
          brand:        h.brand,
          tags:         Array.isArray(h.tags) ? h.tags.join(', ') : h.tags,
          createdAt:    h.createdAt,
          category:     { name: h.categoryName, slug: h.category },
          images:       h.image ? [{ url: h.image, alt: h.imageAlt, order: 0 }] : [],
        }));

        const total = estimatedTotalHits ?? products.length;
        return NextResponse.json({
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
          source: 'meilisearch',
        });

      } catch (meiliError) {
        // Meilisearch unavailable — fall through to Prisma below
        console.warn('[Products API] Meilisearch unavailable, using Prisma fallback:', meiliError.message);
      }
    }

    // ── Prisma path (filter-only queries or Meilisearch fallback) ─────────
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { brand: { contains: search } },
            { tags: { contains: search } },
          ],
        } : {},
        category  ? { category: { slug: category } } : {},
        { price: { gte: minPrice, lte: maxPrice } },
        featured  ? { featured: true } : {},
        inStock   ? { stock: { gt: 0 } } : {},
      ],
    };

    const orderBy = {
      newest:       { createdAt: 'desc' },
      oldest:       { createdAt: 'asc' },
      'price-asc':  { price: 'asc' },
      'price-desc': { price: 'desc' },
      rating:       { rating: 'desc' },
      popular:      { reviewCount: 'desc' },
    }[sort] || { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images:   { orderBy: { order: 'asc' }, take: 1 },
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      source: 'prisma',
    });

  } catch (error) {
    console.error('[GET /api/products]', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}


// POST /api/products — admin: create product
export async function POST(request) {
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { images, categoryId, ...productData } = data;

    if (!productData.name || !productData.price || !categoryId) {
      return NextResponse.json({ error: 'Name, price and category are required' }, { status: 400 });
    }

    // Auto-generate slug
    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    let product;
    try {
      product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description || '',
          brand: productData.brand || null,
          tags: productData.tags || null,
          featured: Boolean(productData.featured),
          slug,
          categoryId,
          price: parseFloat(productData.price),
          comparePrice: productData.comparePrice ? parseFloat(productData.comparePrice) : null,
          stock: parseInt(productData.stock) || 0,
          images: images?.length > 0
            ? { create: images.map((url, i) => ({ url, alt: productData.name, order: i })) }
            : undefined,
        },
        include: { images: true, category: true },
      });
    } catch (e) {
      if (e.code === 'P2002') {
        return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 400 });
      }
      throw e;
    }

    // Sync to Meilisearch (non-blocking — errors don't fail the request)
    syncProductToMeili(product).catch((e) =>
      console.error('[Meilisearch] Post-create sync failed:', e.message)
    );

    return NextResponse.json({ product }, { status: 201 });

  } catch (error) {
    console.error('[POST /api/products]', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
