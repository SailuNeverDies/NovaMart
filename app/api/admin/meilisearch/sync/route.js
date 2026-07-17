import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { meiliAdmin, PRODUCTS_INDEX, flattenProduct, configureMeiliIndex } from '@/lib/meilisearch';

// POST /api/admin/meilisearch/sync
// Admin-only — bulk syncs all Prisma products into the Meilisearch index.
// Run once after setup; after that incremental sync keeps things fresh.
export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Configure index settings first (searchable, filterable, sortable attributes)
    await configureMeiliIndex();

    // 2. Fetch ALL products from Prisma with their first image + category
    const products = await prisma.product.findMany({
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        category: { select: { name: true, slug: true } },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ message: 'No products to sync', synced: 0 });
    }

    // 3. Flatten and bulk upload to Meilisearch
    const docs = products.map(flattenProduct);
    const task = await meiliAdmin
      .index(PRODUCTS_INDEX)
      .addDocuments(docs, { primaryKey: 'id' });

    return NextResponse.json({
      message: `Sync enqueued successfully`,
      synced: docs.length,
      taskUid: task.taskUid,
      status: task.status,
      hint: 'Meilisearch indexes documents asynchronously. Search will be available within a few seconds.',
    });
  } catch (error) {
    console.error('[POST /api/admin/meilisearch/sync]', error);
    return NextResponse.json(
      { error: 'Sync failed', detail: error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/meilisearch/sync — check index stats
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await meiliAdmin.index(PRODUCTS_INDEX).getStats();
    const settings = await meiliAdmin.index(PRODUCTS_INDEX).getSettings();

    return NextResponse.json({ stats, settings });
  } catch (error) {
    // Index may not exist yet
    return NextResponse.json(
      { error: 'Could not fetch stats', detail: error.message },
      { status: 500 }
    );
  }
}
