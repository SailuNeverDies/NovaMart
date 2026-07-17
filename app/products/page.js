'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Fashion', value: 'fashion' },
  { label: 'Home & Kitchen', value: 'home-kitchen' },
  { label: 'Books', value: 'books' },
  { label: 'Sports & Fitness', value: 'sports' },
  { label: 'Beauty', value: 'beauty' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

const PRICE_PRESETS = [
  { label: 'Under $25', min: '', max: '25' },
  { label: '$25 – $100', min: '25', max: '100' },
  { label: '$100 – $500', min: '100', max: '500' },
  { label: 'Over $500', min: '500', max: '' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // All products accumulated for "Load More"
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const featured = searchParams.get('featured') || '';
  const inStock = searchParams.get('inStock') || '';

  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false); // mobile filter toggle

  // Reset accumulated products + page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
  }, [search, category, sort, minPrice, maxPrice, featured, inStock]);

  // Sync local price inputs when URL params change
  useEffect(() => { setLocalMin(minPrice); }, [minPrice]);
  useEffect(() => { setLocalMax(maxPrice); }, [maxPrice]);

  const fetchProducts = useCallback(async (page, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (sort) params.set('sort', sort);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (featured) params.set('featured', featured);
      if (inStock) params.set('inStock', inStock);
      params.set('page', String(page));
      params.set('limit', '12');

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (append) {
        setProducts((prev) => [...prev, ...(data.products || [])]);
      } else {
        setProducts(data.products || []);
      }
      setPagination(data.pagination || { page: 1, total: 0, pages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, category, sort, minPrice, maxPrice, featured, inStock]);

  // Initial load
  useEffect(() => { fetchProducts(1, false); }, [fetchProducts]);

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  function applyPriceFilter() {
    const params = new URLSearchParams(searchParams.toString());
    if (localMin) params.set('minPrice', localMin); else params.delete('minPrice');
    if (localMax) params.set('maxPrice', localMax); else params.delete('maxPrice');
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  function applyPricePreset(preset) {
    const params = new URLSearchParams(searchParams.toString());
    if (preset.min) params.set('minPrice', preset.min); else params.delete('minPrice');
    if (preset.max) params.set('maxPrice', preset.max); else params.delete('maxPrice');
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  function handleLoadMore() {
    const next = currentPage + 1;
    setCurrentPage(next);
    fetchProducts(next, true);
  }

  const hasActiveFilters = !!(category || sort !== 'newest' || minPrice || maxPrice || search || inStock || featured);
  const hasMore = pagination.pages > currentPage;

  const pageTitle = search
    ? `Results for "${search}"`
    : featured
    ? 'Featured Products'
    : category
    ? CATEGORIES.find((c) => c.value === category)?.label || 'Products'
    : 'All Products';

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="container">
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">›</span>
            <span className="current">Products</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1>{pageTitle}</h1>
              {!loading && (
                <p>{pagination.total} product{pagination.total !== 1 ? 's' : ''} found</p>
              )}
            </div>
            {/* Mobile filter toggle */}
            <button
              className="btn btn-outline btn-sm filter-mobile-toggle"
              onClick={() => setFilterOpen(!filterOpen)}
              aria-expanded={filterOpen}
              id="mobile-filter-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filters {hasActiveFilters && <span className="filter-active-dot" />}
            </button>
          </div>
        </div>
      </div>

      <div className="container section">
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
          {/* ── Filter sidebar ── */}
          <aside className={`filter-sidebar${filterOpen ? ' filter-sidebar--open' : ''}`} aria-label="Product filters">
            <div className="card card-padded" style={{ position: 'sticky', top: 'calc(var(--nav-height) + 1rem)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Filters</h2>
                {hasActiveFilters && (
                  <Link href="/products" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} id="clear-filters">
                    Clear all
                  </Link>
                )}
              </div>

              {/* Category */}
              <div className="filter-section">
                <p className="filter-title">Category</p>
                {CATEGORIES.map((cat) => (
                  <label key={cat.value} className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={category === cat.value}
                      onChange={() => updateParam('category', cat.value)}
                      id={`cat-${cat.value || 'all'}`}
                    />
                    {cat.label}
                  </label>
                ))}
              </div>

              {/* Sort */}
              <div className="filter-section">
                <p className="filter-title">Sort By</p>
                {SORT_OPTIONS.map((opt) => (
                  <label key={opt.value} className="filter-option">
                    <input
                      type="radio"
                      name="sort"
                      value={opt.value}
                      checked={sort === opt.value}
                      onChange={() => updateParam('sort', opt.value)}
                      id={`sort-${opt.value}`}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Availability */}
              <div className="filter-section">
                <p className="filter-title">Availability</p>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={inStock === '1'}
                    onChange={(e) => updateParam('inStock', e.target.checked ? '1' : '')}
                    id="filter-instock"
                  />
                  In Stock Only
                </label>
              </div>

              {/* Price presets */}
              <div className="filter-section">
                <p className="filter-title">Price Range</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                  {PRICE_PRESETS.map((p) => {
                    const active = minPrice === p.min && maxPrice === p.max;
                    return (
                      <button
                        key={p.label}
                        className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline'}`}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
                        onClick={() => applyPricePreset(p)}
                        id={`price-preset-${p.label.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <div className="price-range-inputs">
                  <input
                    type="number"
                    placeholder="Min $"
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    min="0"
                    id="price-min"
                    aria-label="Minimum price"
                  />
                  <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>–</span>
                  <input
                    type="number"
                    placeholder="Max $"
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    min="0"
                    id="price-max"
                    aria-label="Maximum price"
                  />
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '0.75rem', width: '100%' }}
                  onClick={applyPriceFilter}
                  id="apply-price-filter"
                >
                  Apply Price
                </button>
              </div>
            </div>
          </aside>

          {/* ── Product grid ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="products-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="product-card">
                    <div className="skeleton" style={{ aspectRatio: '1' }} />
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="skeleton" style={{ height: '0.75rem', width: '40%' }} />
                      <div className="skeleton" style={{ height: '1rem', width: '90%' }} />
                      <div className="skeleton" style={{ height: '1rem', width: '60%' }} />
                      <div className="skeleton" style={{ height: '2.25rem', marginTop: '0.5rem' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <h3>No products found</h3>
                <p>Try adjusting your search or filters to find what you&apos;re looking for.</p>
                <Link href="/products" className="btn btn-primary">Browse All Products</Link>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '3rem' }}>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                      Showing {products.length} of {pagination.total} products
                    </p>
                    <button
                      className="btn btn-outline"
                      style={{ minWidth: '200px', position: 'relative' }}
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      id="load-more-btn"
                    >
                      {loadingMore ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.7s linear infinite' }} aria-hidden="true">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                          Loading...
                        </>
                      ) : (
                        'Load More Products'
                      )}
                    </button>
                  </div>
                )}

                {!hasMore && products.length > 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '2.5rem' }}>
                    You&apos;ve seen all {pagination.total} products!
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container section"><p>Loading...</p></div>}>
      <ProductsContent />
    </Suspense>
  );
}
