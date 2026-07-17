'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, calculateShipping, calculateTax, TAX_RATE } from '@/lib/utils';

const STEPS = ['Shipping', 'Review & Pay', 'Confirmation'];

function StepIndicator({ current }) {
  return (
    <div className="checkout-steps" role="list" aria-label="Checkout steps">
      {STEPS.map((step, i) => (
        <div key={step} className="checkout-step" role="listitem">
          <div className={`step-indicator ${i < current ? 'done' : i === current ? 'active' : ''}`} aria-current={i === current ? 'step' : undefined}>
            {i < current ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span className={`step-label ${i < current ? 'done' : i === current ? 'active' : ''}`}>{step}</span>
          {i < STEPS.length - 1 && <div className={`step-connector ${i < current ? 'done' : ''}`} aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import crypto from 'crypto';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function CheckoutPaymentForm({ clientSecret, address, items, subtotal, shipping, tax, total, session, clearCart, router, setPlacing, placing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPlacing(true);
    setError('');
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw submitError;

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmed`,
          receipt_email: address.email,
        },
        redirect: 'if_required',
      });

      if (confirmError) throw confirmError;

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const idempotencyKey = crypto.randomUUID();
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-idempotency-key': idempotencyKey,
          },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            shippingAddress: address,
            paymentIntentId: paymentIntent.id,
            guestEmail: !session ? address.email : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Order failed');
        clearCart();
        router.push(`/order-confirmed?orderId=${data.order.id}&email=${encodeURIComponent(address.email)}`);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <form onSubmit={handlePlaceOrder} className="card card-padded">
      <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Payment</h2>
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1.5rem', color: '#991b1b', fontSize: '0.9375rem' }}>
          {error}
        </div>
      )}
      <PaymentElement />
      <button
        type="submit"
        className="btn btn-primary btn-lg btn-full"
        disabled={placing || !stripe || !elements}
        style={{ marginTop: '1.5rem' }}
        id="checkout-place-order"
      >
        {placing ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.7s linear infinite' }} aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Processing...
          </>
        ) : (
          <>Place Order · {formatPrice(total)}</>
        )}
      </button>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
        By placing your order you agree to our Terms of Service
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, itemCount, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState('');

  const [address, setAddress] = useState({
    fullName: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax;

  function handleAddressChange(e) {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validateAddress() {
    const required = ['fullName', 'email', 'phone', 'street', 'city', 'state', 'zip'];
    return required.every((f) => address[f]?.trim());
  }

  async function handleNext() {
    if (step === 0) {
      if (!validateAddress()) {
        setError('Please fill in all required shipping fields.');
        return;
      }
      setError('');
      setPlacing(true);
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(i => ({ productId: i.productId, quantity: i.quantity, name: i.name })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to initialize checkout');
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
        setStep(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setPlacing(false);
      }
    }
  }

  if (itemCount === 0 && step !== 2) {
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
          <p>Add some items before checking out.</p>
          <Link href="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '2rem' }}>Checkout</h1>
      <StepIndicator current={step} />

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1.5rem', color: '#991b1b', fontSize: '0.9375rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'start' }}>
        {/* ── Left panel ── */}
        <div>
          {/* STEP 0 — Shipping */}
          {step === 0 && (
            <div className="card card-padded">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Shipping Address</h2>
              <div className="auth-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullName">Full Name *</label>
                    <input id="fullName" name="fullName" className="form-input" value={address.fullName} onChange={handleAddressChange} placeholder="John Smith" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address *</label>
                    <input id="email" name="email" type="email" className="form-input" value={address.email} onChange={handleAddressChange} placeholder="john@example.com" required disabled={!!session} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone *</label>
                  <input id="phone" name="phone" className="form-input" value={address.phone} onChange={handleAddressChange} placeholder="555-0100" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="street">Street Address *</label>
                  <input id="street" name="street" className="form-input" value={address.street} onChange={handleAddressChange} placeholder="123 Main St, Apt 4B" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="city">City *</label>
                    <input id="city" name="city" className="form-input" value={address.city} onChange={handleAddressChange} placeholder="New York" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="state">State *</label>
                    <input id="state" name="state" className="form-input" value={address.state} onChange={handleAddressChange} placeholder="NY" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="zip">ZIP Code *</label>
                    <input id="zip" name="zip" className="form-input" value={address.zip} onChange={handleAddressChange} placeholder="10001" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="country">Country</label>
                    <select id="country" name="country" className="form-select" value={address.country} onChange={handleAddressChange}>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="IN">India</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleNext} disabled={placing} id="checkout-next-step">
                  {placing ? 'Loading...' : 'Continue to Review'}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 1 — Review & Pay */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card card-padded">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.125rem' }}>Shipping To</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)} id="checkout-edit-address">Edit</button>
                </div>
                <p style={{ color: 'var(--color-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                  {address.fullName}<br />
                  {address.street}<br />
                  {address.city}, {address.state} {address.zip}<br />
                  {address.country} · {address.phone}
                </p>
              </div>

              <div className="card card-padded">
                <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Order Items</h2>
                {items.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem' }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                  <CheckoutPaymentForm
                    clientSecret={clientSecret}
                    address={address}
                    items={items}
                    subtotal={subtotal}
                    shipping={shipping}
                    tax={tax}
                    total={total}
                    session={session}
                    clearCart={clearCart}
                    router={router}
                    setPlacing={setPlacing}
                    placing={placing}
                  />
                </Elements>
              ) : (
                <div className="card card-padded" style={{ textAlign: 'center' }}>
                  <p>Loading payment...</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Confirmation (Handled by order-confirmed page) */}
        </div>

        {/* ── Order Summary sidebar ── */}
        {step < 2 && (
          <div className="order-summary">
            <h3>Order Summary</h3>
            {items.map((item) => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
                <span style={{ flex: 1, marginRight: '1rem' }}>{item.name} ×{item.quantity}</span>
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.75rem 0' }} />
            <div className="summary-row">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className={shipping === 0 ? 'free' : ''}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="summary-row">
              <span>Tax ({TAX_RATE * 100}%)</span><span>{formatPrice(tax)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
