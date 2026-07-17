'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useMiniCart } from '@/contexts/MiniCartContext';
import { useToast } from '@/components/Toast';
import FocusTrap from 'focus-trap-react';
import { formatPrice, getDiscountPercent, getRatingStars } from '@/lib/utils';

export default function QuickViewModal({ product, onClose }) {
  const { addItem } = useCart();
  const { openCart } = useMiniCart();
  const addToast = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const discount = getDiscountPercent(product.comparePrice, product.price);
  const stars = getRatingStars(product.rating || 0);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // Close on Escape
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  async function handleAddToCart() {
    if (isOutOfStock || adding) return;
    setAdding(true);
    addItem(product, quantity);
    await new Promise((r) => setTimeout(r, 400));
    setAdding(false);

    const imageUrl = product.images?.[0]?.url || '';
    addToast({
      type: 'cart',
      title: 'Added to Cart!',
      message: `${quantity}× ${product.name}`,
      image: imageUrl,
    });

    openCart();
    onClose();
  }

  return (
    <FocusTrap active={true}>
      <div className="qv-overlay" role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="qv-modal">
          {/* Close */}
        <button className="qv-close" onClick={onClose} aria-label="Close quick view">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Left: Image Gallery */}
        <div className="qv-gallery">
          <div className="qv-main-image">
            {product.images?.[selectedImage]?.url ? (
              <Image
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage]?.alt || product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
                priority
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--color-muted)' }}>No image</span>
              </div>
            )}
            {discount > 0 && (
              <span className="qv-badge">{discount}% OFF</span>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="qv-thumbs">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`qv-thumb${selectedImage === i ? ' active' : ''}`}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={img.url} alt={img.alt || ''} fill sizes="72px" style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="qv-details">
          {product.category?.name && (
            <p className="qv-category">{product.category.name}</p>
          )}
          <h2 className="qv-name">{product.name}</h2>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="qv-rating">
              <div className="stars" aria-label={`${product.rating} out of 5 stars`}>
                {stars.map((s, i) => (
                  <svg key={i} className={`star-${s}`} width="16" height="16" viewBox="0 0 24 24" fill={s === 'empty' ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                {product.rating?.toFixed(1)} ({product.reviewCount?.toLocaleString()} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="qv-price">
            <span className="price-current">{formatPrice(product.price)}</span>
            {product.comparePrice > product.price && (
              <span className="price-compare">{formatPrice(product.comparePrice)}</span>
            )}
          </div>

          {/* Stock badges */}
          {isOutOfStock && (
            <p className="qv-stock out"><span>✕</span> Out of Stock</p>
          )}
          {isLowStock && (
            <p className="qv-stock low"><span>⚡</span> Only {product.stock} left in stock — order soon!</p>
          )}
          {!isOutOfStock && !isLowStock && (
            <p className="qv-stock in"><span>✓</span> In Stock</p>
          )}

          {/* Description */}
          <p className="qv-desc">{product.description}</p>

          {/* Quantity + Add to Cart */}
          {!isOutOfStock && (
            <div className="qv-actions">
              <div className="qv-qty">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <span className="qty-value" style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleAddToCart}
                disabled={adding}
                id={`qv-add-to-cart-${product.id}`}
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          <Link
            href={`/products/${product.id}`}
            className="qv-full-link"
            onClick={onClose}
          >
            View Full Details →
          </Link>
        </div>
      </div>
    </div>
    </FocusTrap>
  );
}
