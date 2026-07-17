'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function validate() {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed.'); return; }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: form.email.toLowerCase(),
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        router.push('/auth/signin');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: 'var(--color-destructive)', width: '20%' };
    if (p.length < 8) return { label: 'Weak', color: 'var(--color-warning)', width: '40%' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Fair', color: 'var(--color-warning)', width: '60%' };
    if (p.length >= 10) return { label: 'Strong', color: 'var(--color-success)', width: '100%' };
    return { label: 'Good', color: 'var(--color-success)', width: '80%' };
  })();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link href="/">Nova<span>Mart</span></Link>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join NovaMart and start shopping today</p>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#991b1b', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input id="name" name="name" type="text" className="form-input" placeholder="John Smith" value={form.name} onChange={handleChange} autoComplete="name" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" className="form-input" placeholder="At least 6 characters" value={form.password} onChange={handleChange} autoComplete="new-password" required />
            {passwordStrength && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: passwordStrength.width, background: passwordStrength.color, borderRadius: '2px', transition: 'width 0.3s, background 0.3s' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: passwordStrength.color, marginTop: '0.25rem', fontWeight: 600 }}>{passwordStrength.label}</p>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm Password</label>
            <input id="confirm" name="confirm" type="password" className="form-input" placeholder="Repeat your password" value={form.confirm} onChange={handleChange} autoComplete="new-password" required />
            {form.confirm && form.password !== form.confirm && (
              <p className="form-error">Passwords do not match</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="signup-submit">
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.7s linear infinite' }} aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Creating account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="auth-divider">
          Already have an account? <Link href="/auth/signin">Sign in</Link>
        </p>
      </div>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
