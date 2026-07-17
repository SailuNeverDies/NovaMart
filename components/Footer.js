'use client';

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand column */}
          <div className="footer-brand">
            <h3>Nova<span>Mart</span></h3>
            <p>
              Your one-stop destination for premium products at unbeatable prices.
              Fast shipping, secure payments, and hassle-free returns.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Social icons */}
              {[
                { label: 'Facebook', path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                { label: 'Twitter/X', path: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z' },
                { label: 'Instagram', path: 'M5 2C3.35 2 2 3.35 2 5v14c0 1.65 1.35 3 3 3h14c1.65 0 3-1.35 3-3V5c0-1.65-1.35-3-3-3H5zm7 5a5 5 0 1 1 0 10A5 5 0 0 1 12 7zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.25-2a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z' },
              ].map((s) => (
                <a
                  key={s.label}
                  href="/"
                  aria-label={s.label}
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <div className="footer-section">
            <h4>Shop</h4>
            <nav className="footer-links">
              <Link href="/products?category=electronics">Electronics</Link>
              <Link href="/products?category=fashion">Fashion</Link>
              <Link href="/products?category=home-kitchen">Home & Kitchen</Link>
              <Link href="/products?category=books">Books</Link>
              <Link href="/products?category=sports">Sports & Fitness</Link>
              <Link href="/products?category=beauty">Beauty</Link>
            </nav>
          </div>

          <div className="footer-section">
            <h4>Customer Care</h4>
            <nav className="footer-links">
              <Link href="/account/orders">Track Order</Link>
              <Link href="/account">My Account</Link>
              <Link href="/help">Help Center</Link>
              <Link href="/returns">Return Policy</Link>
              <Link href="/shipping">Shipping Info</Link>
              <Link href="/size-guide">Size Guide</Link>
            </nav>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <nav className="footer-links">
              <Link href="/about">About Us</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/press">Press</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© {year} NovaMart. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Payment method icons (text-based) */}
            {['Visa', 'Mastercard', 'PayPal', 'Stripe'].map((pm) => (
              <span
                key={pm}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '0.25rem',
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.025em',
                }}
              >
                {pm}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
