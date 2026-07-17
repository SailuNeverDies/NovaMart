'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useMiniCart } from '@/contexts/MiniCartContext';
import { useToast } from '@/components/Toast';
import { formatPrice, getDiscountPercent, getRatingStars } from '@/lib/utils';
import WishlistButton from '@/components/WishlistButton';
import dynamic from 'next/dynamic';

const QuickViewModal = dynamic(() => import('@/components/QuickViewModal'), { ssr: false });

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { openCart } = useMiniCart();
  const addToast = useToast();

  const [adding, setAdding] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const discount = getDiscountPercent(product.comparePrice, product.price);
  const stars = getRatingStars(product.rating || 0);
  const imageUrl = product.images?.[0]?.url || 'https://placehold.co/400x400?text=No+Image';
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || adding) return;

    setAdding(true);
    addItem(product);

    addToast({
      type: 'cart',
      title: 'Added to Cart!',
      message: product.name,
      image: imageUrl,
    });
    openCart();

    await new Promise((r) => setTimeout(r, 600));
    setAdding(false);
  }

  return (
    <>
      <article className="product-card">
        {/* Image area */}
        <div className="product-card-image-wrap">
          <Link href={`/products/${product.id}`} className="product-card-image" aria-label={product.name}>
            <Image
              src={imageUrl}
              alt={product.images?.[0]?.alt || product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />

            {/* Discount badge */}
            {discount > 0 && (
              <div className="product-card-badge">
                <span className="badge badge-error">{discount}% OFF</span>
              </div>
            )}

            {/* Low stock scarcity badge */}
            {isLowStock && (
              <div className="product-card-badge product-card-badge--low" style={{ top: discount > 0 ? '2.5rem' : '0.75rem' }}>
                <span className="badge badge-warning">⚡ Only {product.stock} left!</span>
              </div>
            )}

            {/* Out of stock overlay */}
            {isOutOfStock && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.875rem', padding: '0.35rem 0.75rem' }}>Out of Stock</span>
              </div>
            )}
          </Link>

          {/* Wishlist heart button */}
          <WishlistButton
            productId={product.id}
            productName={product.name}
            className="product-card-wishlist"
          />

          {/* Quick View hover button */}
          {!isOutOfStock && (
            <button
              className="product-card-quickview"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickView(true); }}
              aria-label={`Quick view ${product.name}`}
              id={`quick-view-${product.id}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Quick View
            </button>
          )}
        </div>

        <div className="product-card-body">
          {/* Category */}
          {product.category?.name && (
            <p className="product-card-category">{product.category.name}</p>
          )}

          {/* Name */}
          <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
            <h3 className="product-card-name">{product.name}</h3>
          </Link>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="product-card-rating">
              <div className="stars" aria-label={`${product.rating || 0} out of 5 stars`}>
                {stars.map((s, i) => (
                  <svg key={i} className={`star-${s}`} width="14" height="14" viewBox="0 0 24 24" fill={s === 'empty' ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <span>({product.reviewCount?.toLocaleString() || 0})</span>
            </div>
          )}

          {/* Price */}
          <div className="product-card-price">
            <span className="price-current">{formatPrice(product.price)}</span>
            {product.comparePrice > product.price && (
              <span className="price-compare">{formatPrice(product.comparePrice)}</span>
            )}
            {discount > 0 && (
              <span className="price-discount">Save {discount}%</span>
            )}
          </div>
        </div>

        {/* Add to cart footer */}
        <div className="product-card-footer">
          <button
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            aria-label={isOutOfStock ? 'Out of stock' : `Add ${product.name} to cart`}
            id={`add-to-cart-${product.id}`}
          >
            {adding ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.7s linear infinite' }} aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Adding...
              </>
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Add to Cart
              </>
            )}
          </button>
        </div>

        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </article>

      {/* Quick View Modal (lazy loaded) */}
      {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
}
