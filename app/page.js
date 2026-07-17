import BannerSlider from '@/components/BannerSlider';
import CategoryGrid from '@/components/CategoryGrid';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import NewsletterForm from '@/components/NewsletterForm';

export const metadata = {
  title: 'NovaMart — Shop Everything',
  description: 'Discover amazing deals on electronics, fashion, home goods, books, sports, and beauty products.',
};

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { featured: true, stock: { gt: 0 } },
    take: 8,
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { rating: 'desc' },
  });
}

async function getNewArrivals() {
  return prisma.product.findMany({
    where: { stock: { gt: 0 }, featured: false },
    take: 8,
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getBestSellers() {
  return prisma.product.findMany({
    where: { stock: { gt: 0 } },
    take: 4,
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { reviewCount: 'desc' },
  });
}

export default async function HomePage() {
  const [featuredProducts, newArrivals, bestSellers] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivals(),
    getBestSellers(),
  ]);

  return (
    <>
      {/* ── Hero Banner ──────────────────────────────────────────── */}
      <BannerSlider />

      {/* ── Category Grid ────────────────────────────────────────── */}
      <section className="section section-sm">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <Link href="/categories" className="section-link">
              All Categories
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="section" style={{ background: 'var(--color-surface-2)' }}>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Featured Products</h2>
              <Link href="/products?featured=true" className="section-link">
                View All
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Promo Banner ──────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0', background: 'linear-gradient(135deg, var(--color-primary) 0%, #292524 100%)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Free Shipping
            </p>
            <h2 style={{ color: 'white', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontFamily: 'var(--font-heading)', fontWeight: 700, lineHeight: 1.2, marginBottom: '1rem' }}>
              Orders Over $50 Ship Free
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Shop smarter. Spend over $50 and get free standard shipping on your entire order, every time.
            </p>
            <Link href="/products" className="btn btn-primary btn-lg">Start Shopping</Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: '24+ Products', sub: 'In all categories' },
              { label: 'Secure Pay', sub: 'SSL encrypted' },
              { label: 'Easy Returns', sub: '30-day policy' },
              { label: '24/7 Support', sub: 'Always available' },
            ].map((item) => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '1rem',
                padding: '1.5rem',
                textAlign: 'center',
                minWidth: '130px',
              }}>
                <p style={{ color: 'white', fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '0.25rem' }}>
                  {item.label}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ──────────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">New Arrivals</h2>
              <Link href="/products?sort=newest" className="section-link">
                See More
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
            <div className="products-grid">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Best Sellers ──────────────────────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="section" style={{ background: 'var(--color-surface-2)' }}>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Best Sellers</h2>
              <Link href="/products?sort=popular" className="section-link">
                View All
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
            <div className="products-grid">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, var(--color-accent-light) 0%, #fde68a 100%)',
            borderRadius: '1.5rem',
            padding: '3rem',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
              Get Exclusive Deals
            </h2>
            <p style={{ color: 'var(--color-secondary)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
              Subscribe to our newsletter and be the first to know about sales, new arrivals, and more.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
