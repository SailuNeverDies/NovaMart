'use client';

import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/CartItem';
import Link from 'next/link';
import { formatPrice, calculateShipping, calculateTax } from '@/lib/utils';

export default function CartPage() {
  const { items, subtotal, itemCount, clearCart } = useCart();

  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax;

  if (itemCount === 0) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven&apos;t added anything to your cart yet. Start shopping to fill it up!</p>
          <Link href="/products" className="btn btn-primary btn-lg" id="cart-shop-now">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
          Shopping Cart
          <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '0.75rem' }}>
            ({itemCount} item{itemCount !== 1 ? 's' : ''})
          </span>
        </h1>
        <button
          className="btn btn-ghost btn-sm"
          onClick={clearCart}
          style={{ color: 'var(--color-destructive)' }}
          id="cart-clear"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Clear Cart
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'start' }}>
        {/* Cart items */}
        <div className="card card-padded">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/products" className="btn btn-outline" id="cart-continue-shopping">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>

          <div className="summary-row">
            <span>Subtotal ({itemCount} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span className={shipping === 0 ? 'free' : ''}>
              {shipping === 0 ? 'Free' : formatPrice(shipping)}
            </span>
          </div>
          {shipping > 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
              Add {formatPrice(50 - subtotal)} more for free shipping
            </p>
          )}
          <div className="summary-row">
            <span>Estimated Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <Link href="/checkout" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '1.5rem' }} id="cart-checkout">
            Proceed to Checkout
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>

          <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', textAlign: 'center', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
