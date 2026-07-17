'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    setTimeout(() => setStatus('success'), 1000);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '480px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
      <input
        type="email"
        placeholder="Enter your email address"
        className="form-input"
        style={{ flex: 1, minWidth: '240px', borderColor: status === 'error' ? 'var(--color-destructive)' : undefined }}
        aria-label="Email for newsletter"
        id="newsletter-email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
        disabled={status === 'loading' || status === 'success'}
      />
      <button type="submit" className="btn btn-primary" id="newsletter-submit" disabled={status === 'loading' || status === 'success'}>
        {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
      </button>
      {status === 'error' && <p style={{ width: '100%', color: 'var(--color-destructive)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Please enter a valid email address.</p>}
    </form>
  );
}
