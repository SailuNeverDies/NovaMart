'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Suspense } from 'react';

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const guestEmail = searchParams.get('email');
  const { data: session } = useSession();

  return (
    <div className="container section" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        width: '5rem', height: '5rem', borderRadius: '50%',
        background: '#d1fae5', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 1.5rem',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Order Confirmed!</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: '1.125rem', marginBottom: '1.5rem' }}>
        Thank you for your purchase. We&apos;ve received your order and will begin processing it right away.
      </p>

      {/* Guest Signup Prompt */}
      {!session && guestEmail && (
        <div style={{ background: 'var(--color-surface-2)', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', textAlign: 'left', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Save your details for next time!
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-secondary)', marginBottom: '1rem' }}>
            Create an account with <strong>{guestEmail}</strong> to track your order status and checkout faster next time.
          </p>
          <Link href={`/auth/signup?email=${encodeURIComponent(guestEmail)}`} className="btn btn-primary btn-sm">
            Create Account
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {session && (
          <Link href="/account/orders" className="btn btn-outline">
            View My Orders
          </Link>
        )}
        <Link href="/products" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<div className="container section text-center">Loading...</div>}>
      <OrderConfirmedContent />
    </Suspense>
  );
}
