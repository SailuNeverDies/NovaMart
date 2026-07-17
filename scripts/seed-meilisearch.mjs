/**
 * One-time Meilisearch seed script.
 * Run with: node scripts/seed-meilisearch.mjs
 * This reads all products from Prisma and indexes them into Meilisearch.
 */

import { PrismaClient } from '@prisma/client';
import { Meilisearch } from 'meilisearch';

const prisma = new PrismaClient();

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_ADMIN_KEY = process.env.MEILISEARCH_ADMIN_KEY || 'novamart_dev_key';
const PRODUCTS_INDEX = 'products';

const client = new Meilisearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_ADMIN_KEY,
});

function flattenProduct(p) {
  return {
    id:           p.id,
    name:         p.name,
    slug:         p.slug,
    description:  p.description,
    price:        p.price,
    comparePrice: p.comparePrice ?? null,
    stock:        p.stock,
    featured:     p.featured,
    rating:       p.rating,
    reviewCount:  p.reviewCount,
    brand:        p.brand || '',
    tags:         p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    category:     p.category?.slug || '',
    categoryName: p.category?.name || '',
    image:        p.images?.[0]?.url || null,
    imageAlt:     p.images?.[0]?.alt || p.name,
    createdAt:    p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

async function main() {
  console.log('🔍 Connecting to Meilisearch at', MEILISEARCH_HOST);

  // 1. Check Meilisearch health
  const health = await client.health();
  console.log('✅ Meilisearch status:', health.status);

  // 2. Configure index settings
  console.log('\n⚙️  Configuring index settings...');
  const index = client.index(PRODUCTS_INDEX);
  await index.updateSettings({
    searchableAttributes: ['name', 'brand', 'tags', 'description'],
    filterableAttributes: ['category', 'price', 'stock', 'featured', 'rating', 'reviewCount'],
    sortableAttributes:   ['price', 'rating', 'reviewCount', 'createdAt'],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
    pagination: { maxTotalHits: 1000 },
  });
  console.log('✅ Index settings applied');

  // 3. Fetch all products from Prisma
  console.log('\n📦 Fetching products from database...');
  const products = await prisma.product.findMany({
    include: {
      images:   { orderBy: { order: 'asc' }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
  });
  console.log(`✅ Found ${products.length} products`);

  if (products.length === 0) {
    console.log('⚠️  No products found. Run your seed script first.');
    return;
  }

  // 4. Flatten and upload
  console.log('\n🚀 Uploading to Meilisearch...');
  const docs = products.map(flattenProduct);
  const task = await index.addDocuments(docs, { primaryKey: 'id' });
  console.log(`✅ Sync enqueued: ${docs.length} documents (taskUid: ${task.taskUid})`);

  // 5. Wait for indexing to complete
  console.log('\n⏳ Waiting for indexing to complete...');
  await client.tasks.waitForTask(task.taskUid, { timeOutMs: 30000 });
  console.log('✅ Indexing complete!');

  // 6. Verify
  const stats = await index.getStats();
  console.log('\n📊 Index stats:');
  console.log(`   Documents indexed: ${stats.numberOfDocuments}`);
  console.log(`   Is indexing:       ${stats.isIndexing}`);

  // 7. Quick typo test
  console.log('\n🔤 Typo tolerance test — searching "wireles earbuds":');
  const results = await index.search('wireles earbuds', { limit: 3 });
  results.hits.forEach((h, i) => {
    console.log(`   ${i + 1}. ${h.name} ($${h.price})`);
  });

  console.log('\n🎉 Meilisearch is fully set up and ready!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
