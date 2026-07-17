import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ImageGallery from '@/components/ImageGallery';
import AddToCartSection from './AddToCartSection';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { formatPrice, getDiscountPercent, getRatingStars } from '@/lib/utils';
import ReviewForm from '@/components/ReviewForm';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, description: true, images: { take: 1, orderBy: { order: 'asc' } } },
  });
  if (!product) return { title: 'Product Not Found' };
  return {
    title: product.name,
    description: product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.substring(0, 160),
      images: [{ url: product.images[0]?.url || '/placeholder.png' }],
      type: 'website',
    },
  };
}

async function getProduct(id) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
      category: { select: { name: true, slug: true } },
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });
}

async function getRelated(categoryId, currentId) {
  return prisma.product.findMany({
    where: { categoryId, id: { not: currentId }, stock: { gt: 0 } },
    take: 4,
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
  });
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const [product, related] = await Promise.all([
    getProduct(id),
    getProduct(id).then((p) => p ? getRelated(p.categoryId, id) : []),
  ]);

  if (!product) notFound();

  const discount = getDiscountPercent(product.comparePrice, product.price);
  const stars = getRatingStars(product.rating || 0);
  const inStock = product.stock > 0;

  return (
    <>
      <div className="container section">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/products">Products</Link>
          <span className="sep">›</span>
          {product.category && (
            <>
              <Link href={`/products?category=${product.category.slug}`}>{product.category.name}</Link>
              <span className="sep">›</span>
            </>
          )}
          <span className="current">{product.name}</span>
        </nav>

        {/* Product main section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
          {/* Image Gallery */}
          <ImageGallery images={product.images} productName={product.name} />

          {/* Product Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Category & Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {product.category && (
                <Link href={`/products?category=${product.category.slug}`}>
                  <span className="badge badge-accent">{product.category.name}</span>
                </Link>
              )}
              {product.brand && (
                <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>by {product.brand}</span>
              )}
            </div>

            {/* Name */}
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.3 }}>{product.name}</h1>

            {/* Rating */}
            {product.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="stars" aria-label={`Rated ${product.rating} out of 5`}>
                  {stars.map((s, i) => (
                    <svg key={i} className={`star-${s}`} width="18" height="18" viewBox="0 0 24 24" fill={s === 'empty' ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{product.rating}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                  ({product.reviewCount?.toLocaleString()} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}>
                {formatPrice(product.price)}
              </span>
              {product.comparePrice > product.price && (
                <>
                  <span style={{ fontSize: '1.125rem', color: 'var(--color-muted)', textDecoration: 'line-through' }}>
                    {formatPrice(product.comparePrice)}
                  </span>
                  <span className="badge badge-error" style={{ fontSize: '0.875rem' }}>
                    {discount}% OFF — You save {formatPrice(product.comparePrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Stock indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '0.625rem', height: '0.625rem', borderRadius: '50%',
                background: inStock ? 'var(--color-success)' : 'var(--color-destructive)',
              }} aria-hidden="true" />
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: inStock ? 'var(--color-success)' : 'var(--color-destructive)' }}>
                {inStock ? (product.stock <= 10 ? `Only ${product.stock} left in stock` : 'In Stock') : 'Out of Stock'}
              </span>
            </div>

            {/* Scarcity urgency bar — shown when stock <= 5 */}
            {inStock && product.stock <= 5 && (
              <div className="scarcity-bar" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <p>⚡ Only <strong>{product.stock} left</strong> in stock — order soon before it sells out!</p>
              </div>
            )}

            {/* Add to cart (client component) */}
            <AddToCartSection product={product} />

            {/* Trust badges */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
              padding: '1.25rem', background: 'var(--color-surface-2)', borderRadius: '0.75rem',
            }}>
              {[
                { icon: 'M5 12l5 5L20 7', label: 'Authentic Product' },
                { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label: 'Secure Payment' },
                { icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10', label: 'Free Returns' },
              ].map((badge) => (
                <div key={badge.label} style={{ textAlign: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 0.375rem' }} aria-hidden="true">
                    <path d={badge.icon}/>
                  </svg>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 600 }}>{badge.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description Tabs */}
        <div style={{ marginTop: '4rem' }}>
          <div style={{
            borderBottom: '2px solid var(--color-border)',
            display: 'flex',
            gap: '2rem',
            marginBottom: '2rem',
          }}>
            <span style={{
              paddingBottom: '0.75rem',
              borderBottom: '2px solid var(--color-accent)',
              marginBottom: '-2px',
              fontWeight: 700,
              color: 'var(--color-accent)',
              fontSize: '0.9375rem',
            }}>
              Product Description
            </span>
          </div>
          <div style={{ maxWidth: '720px', lineHeight: 1.8, color: 'var(--color-secondary)', fontSize: '1.0625rem' }}>
            {product.description.split('\n').map((p, i) => (
              <p key={i} style={{ marginBottom: '1rem' }}>{p}</p>
            ))}
          </div>
          {product.tags && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              {product.tags.split(',').map((tag) => (
                <span key={tag} className="badge badge-neutral" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div style={{ marginTop: '4rem' }}>
          <div style={{
            borderBottom: '2px solid var(--color-border)',
            display: 'flex',
            gap: '2rem',
            marginBottom: '2rem',
          }}>
            <span style={{
              paddingBottom: '0.75rem',
              borderBottom: '2px solid var(--color-accent)',
              marginBottom: '-2px',
              fontWeight: 700,
              color: 'var(--color-accent)',
              fontSize: '0.9375rem',
            }}>
              Customer Reviews ({product.reviewCount || 0})
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '3rem', alignItems: 'start' }}>
            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {!product.reviews || product.reviews.length === 0 ? (
                <p style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>No reviews yet. Be the first to review this product!</p>
              ) : (
                product.reviews.map((review) => {
                  const revStars = getRatingStars(review.rating);
                  return (
                    <div key={review.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-secondary)' }}>
                            {review.user.name ? review.user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.125rem' }}>{review.user.name || 'Anonymous User'}</p>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                              {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="stars" aria-label={`Rated ${review.rating} out of 5`}>
                          {revStars.map((s, i) => (
                            <svg key={i} className={`star-${s}`} width="14" height="14" viewBox="0 0 24 24" fill={s === 'empty' ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                      {review.title && <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>{review.title}</h4>}
                      <p style={{ color: 'var(--color-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginTop: review.title ? 0 : '1rem' }}>
                        {review.body}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Write a Review Sidebar */}
            <div style={{ position: 'sticky', top: '6rem' }}>
              <ReviewForm productId={product.id} />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: '5rem' }}>
            <div className="section-header">
              <h2 className="section-title">You May Also Like</h2>
            </div>
            <div className="products-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
