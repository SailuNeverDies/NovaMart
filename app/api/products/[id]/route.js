import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { syncProductToMeili, deleteProductFromMeili } from '@/lib/meilisearch';

// GET /api/products/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: { select: { name: true, slug: true } },
      },
    });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    console.error('[GET /api/products/[id]]', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/products/[id] — admin: update product
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { images, ...productData } = data;

    // Update product fields
    const updateQuery = prisma.product.update({
      where: { id },
      data: {
        ...(productData.name && { name: productData.name }),
        ...(productData.description !== undefined && { description: productData.description }),
        ...(productData.brand !== undefined && { brand: productData.brand }),
        ...(productData.tags !== undefined && { tags: productData.tags }),
        ...(productData.featured !== undefined && { featured: Boolean(productData.featured) }),
        ...(productData.categoryId && { categoryId: productData.categoryId }),
        price: productData.price ? parseFloat(productData.price) : undefined,
        comparePrice: productData.comparePrice ? parseFloat(productData.comparePrice) : null,
        stock: productData.stock !== undefined ? parseInt(productData.stock) : undefined,
        updatedAt: new Date(),
      },
      include: { images: true, category: true },
    });

    let updated;
    if (images && images.length > 0) {
      const [updatedResult] = await prisma.$transaction([
        updateQuery,
        prisma.productImage.deleteMany({ where: { productId: id } }),
        prisma.productImage.createMany({
          data: images.map((url, i) => ({ url, alt: productData.name || 'Product Image', order: i, productId: id })),
        }),
      ]);
      updated = updatedResult;
    } else {
      updated = await updateQuery;
    }

    // Sync to Meilisearch
    syncProductToMeili(updated).catch(e => console.error('[Meilisearch Sync Error]', e));

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error('[PUT /api/products/[id]]', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products/[id] — admin: delete product
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.product.delete({ where: { id } });

    // Remove from Meilisearch
    deleteProductFromMeili(id).catch(e => console.error('[Meilisearch Delete Error]', e));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/products/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
