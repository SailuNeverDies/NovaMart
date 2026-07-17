import { Meilisearch } from 'meilisearch';

// ─── Admin client (server-side only — uses master key) ─────────────────────
// Used for: indexing documents, updating settings, deleting documents
export const meiliAdmin = new Meilisearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_ADMIN_KEY,
});

// ─── Index name ─────────────────────────────────────────────────────────────
export const PRODUCTS_INDEX = 'products';

// ─── Flatten a Prisma product into a Meilisearch document ───────────────────
// Meilisearch needs flat objects — no nested relations
export function flattenProduct(p) {
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
    // Split comma-separated tags into an array for better tokenization
    tags:         p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    // Category stored as slug (for filtering) + name (for display)
    category:     p.category?.slug || '',
    categoryName: p.category?.name || '',
    // First image
    image:        p.images?.[0]?.url || null,
    imageAlt:     p.images?.[0]?.alt || p.name,
    // ISO string so Meilisearch can sort chronologically
    createdAt:    p.createdAt instanceof Date
                    ? p.createdAt.toISOString()
                    : p.createdAt,
  };
}

// ─── Sync a single product to Meilisearch ──────────────────────────────────
// Call this after prisma.product.create() or prisma.product.update()
export async function syncProductToMeili(product) {
  try {
    const doc = flattenProduct(product);
    await meiliAdmin.index(PRODUCTS_INDEX).addDocuments([doc], { primaryKey: 'id' });
  } catch (err) {
    // Non-fatal — log but don't crash the request
    console.error('[Meilisearch] syncProductToMeili failed:', err.message);
  }
}

// ─── Remove a product from Meilisearch ─────────────────────────────────────
// Call this after prisma.product.delete()
export async function deleteProductFromMeili(productId) {
  try {
    await meiliAdmin.index(PRODUCTS_INDEX).deleteDocument(productId);
  } catch (err) {
    console.error('[Meilisearch] deleteProductFromMeili failed:', err.message);
  }
}

// ─── Configure index settings (run once during sync) ───────────────────────
export async function configureMeiliIndex() {
  const index = meiliAdmin.index(PRODUCTS_INDEX);
  await index.updateSettings({
    // Full-text search priority: name > brand > tags > description
    searchableAttributes: ['name', 'brand', 'tags', 'description'],
    // Attributes usable in filter expressions
    filterableAttributes: ['category', 'price', 'stock', 'featured', 'rating', 'reviewCount'],
    // Attributes usable in sort expressions
    sortableAttributes: ['price', 'rating', 'reviewCount', 'createdAt'],
    // Typo tolerance — Meilisearch default is already good, but let's be explicit
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
    // Pagination
    pagination: { maxTotalHits: 1000 },
  });
}
