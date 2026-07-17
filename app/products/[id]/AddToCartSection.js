'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useMiniCart } from '@/contexts/MiniCartContext';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import WishlistButton from '@/components/WishlistButton';
import { formatPrice } from '@/lib/utils';

export default function AddToCartSection({ product }) {
  const { addItem } = useCart();
  const { openCart } = useMiniCart();
  const addToast = useToast();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const imageUrl = product.images?.[0]?.url || '';

  const inStock = product.stock > 0;
  const maxQty = Math.min(product.stock, 10);

  async function handleAddToCart() {
    if (!inStock) return;
    setAdding(true);
    addItem(product, quantity);
    addToast({ type: 'cart', title: 'Added to Cart!', message: `${quantity}× ${product.name}`, image: imageUrl });
    openCart();
    await new Promise((r) => setTimeout(r, 600));
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  function handleBuyNow() {
    addItem(product, quantity);
    router.push('/checkout');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Qty selector */}
      {inStock && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-secondary)' }}>Quantity:</span>
          <div className="qty-control">
            <button
              className="qty-btn"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              id="detail-qty-dec"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <span className="qty-display">{quantity}</span>
            <button
              className="qty-btn"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              aria-label="Increase quantity"
              id="detail-qty-inc"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          {product.stock <= 10 && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-warning)' }}>
              {product.stock} available
            </span>
          )}
        </div>
      )}

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          className={`btn btn-lg ${added ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          style={{ flex: 1 }}
          id="detail-add-to-cart"
          aria-label={inStock ? 'Add to cart' : 'Out of stock'}
        >
          {adding ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.7s linear infinite' }} aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Adding...
            </>
          ) : added ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Added to Cart!
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </>
          )}
        </button>

        {inStock && (
          <button
            className="btn btn-secondary btn-lg"
            onClick={handleBuyNow}
            style={{ flex: 1 }}
            id="detail-buy-now"
          >
            Buy Now
          </button>
        )}

        {/* Wishlist button */}
        <WishlistButton
          productId={product.id}
          productName={product.name}
          className="detail-wishlist-btn"
          size={22}
        />
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
