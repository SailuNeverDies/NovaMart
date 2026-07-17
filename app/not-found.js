import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="container section" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <div style={{ fontSize: '6rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--color-accent)', lineHeight: 1, marginBottom: '1rem' }}>
        404
      </div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Page Not Found</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: '1.0625rem', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-primary btn-lg" id="404-home">Go to Homepage</Link>
        <Link href="/products" className="btn btn-outline btn-lg" id="404-products">Browse Products</Link>
      </div>
    </div>
  );
}
