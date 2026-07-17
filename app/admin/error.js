'use client';

import { useEffect } from 'react';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="card card-padded" style={{ textAlign: 'center', padding: '4rem 2rem', margin: '2rem auto', maxWidth: '600px' }}>
      <div style={{
        background: '#fee2e2',
        color: '#991b1b',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Admin Panel Error</h2>
      <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
        An error occurred while loading this administrative view.
      </p>
      <div style={{ background: '#f871711a', padding: '1rem', borderRadius: '0.5rem', textAlign: 'left', marginBottom: '2rem', border: '1px solid #f87171' }}>
        <code style={{ color: '#b91c1c', fontSize: '0.875rem' }}>
          {error.message || 'Unknown error occurred'}
        </code>
      </div>
      <button className="btn btn-primary" onClick={() => reset()}>
        Try to Recover
      </button>
    </div>
  );
}
