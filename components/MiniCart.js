'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FocusTrap from 'focus-trap-react';
import { useCart } from '@/contexts/CartContext';
import { useMiniCart } from '@/contexts/MiniCartContext';
import { formatPrice } from '@/lib/utils';

export default function MiniCart() {
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const { isOpen, closeCart } = useMiniCart();
  const drawerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') closeCart();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  const FREE_SHIPPING_THRESHOLD = 50;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mini-cart-backdrop${isOpen ? ' open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <FocusTrap active={isOpen}>
        <aside
          ref={drawerRef}
          className={`mini-cart${isOpen ? ' open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          {/* Header */}
          <div className="mini-cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <h2 className="mini-cart-title">Your Cart</h2>
              {itemCount > 0 && (
                <span className="mini-cart-count">{itemCount}</span>
              )}
            </div>
            <button className="mini-cart-close" onClick={closeCart} aria-label="Close cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Free Shipping Progress */}
          {itemCount > 0 && (
            <div className="mini-cart-shipping-bar">
              {remaining > 0 ? (
                <p className="mini-cart-shipping-text">
                  Add <strong>{formatPrice(remaining)}</strong> more for <strong>free shipping!</strong>
                </p>
              ) : (
                <p className="mini-cart-shipping-text" style={{ color: 'var(--color-success)' }}>
                  🎉 You've unlocked free shipping!
                </p>
              )}
              <div className="mini-cart-progress-track">
                <div className="mini-cart-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="mini-cart-body">
            {items.length === 0 ? (
              <div className="mini-cart-empty">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-border)' }} aria-hidden="true">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <p style={{ fontWeight: 600, marginTop: '1rem', color: 'var(--color-foreground)' }}>Your cart is empty</p>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Add some items to get started!</p>
                <button className="btn btn-primary" onClick={closeCart} style={{ marginTop: '1.5rem' }}>
                  Start Shopping
                </button>
              </div>
            ) : (
              <ul className="mini-cart-items">
                {items.map((item) => (
                  <li key={item.productId} className="mini-cart-item">
                    {/* Image */}
                    <div className="mini-cart-item-image">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-2)' }} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="mini-cart-item-details">
                      <Link
                        href={`/products/${item.productId}`}
                        className="mini-cart-item-name"
                        onClick={closeCart}
                      >
                        {item.name}
                      </Link>
                      <p className="mini-cart-item-price">{formatPrice(item.price)}</p>

                      {/* Quantity controls */}
                      <div className="mini-cart-item-qty">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= (item.stock || 99)}
                          aria-label="Increase quantity"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Line total + remove */}
                    <div className="mini-cart-item-right">
                      <p className="mini-cart-item-total">{formatPrice(item.price * item.quantity)}</p>
                      <button
                        className="mini-cart-remove"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="mini-cart-footer">
              <div className="mini-cart-subtotal">
                <span>Subtotal</span>
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{formatPrice(subtotal)}</span>
              </div>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                Taxes and shipping calculated at checkout.
              </p>
              <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.875rem' }} onClick={closeCart} id="mini-cart-checkout">
                Proceed to Checkout →
              </Link>
              <Link href="/cart" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '0.625rem' }} onClick={closeCart} id="mini-cart-view-cart">
                View Full Cart
              </Link>
            </div>
          )}
        </aside>
      </FocusTrap>
    </>
  );
}
