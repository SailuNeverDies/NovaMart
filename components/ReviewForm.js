'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ReviewForm({ productId }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!session) {
    return (
      <div className="card card-padded" style={{ textAlign: 'center', background: 'var(--color-surface-2)', border: 'none' }}>
        <p style={{ marginBottom: '1rem', color: 'var(--color-secondary)' }}>Sign in to write a review</p>
        <button onClick={() => router.push(`/auth/signin?callbackUrl=/products/${productId}`)} className="btn btn-outline">
          Sign In
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="card card-padded" style={{ textAlign: 'center', background: '#d1fae5', border: '1px solid #34d399', color: '#065f46' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Thank you!</h3>
        <p>Your review has been submitted successfully.</p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }
    if (!body.trim()) {
      setError('Please write a review');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title, body }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setSuccess(true);
      // Refresh the page data to show the new review and updated rating
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card card-padded">
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Write a Review</h3>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Rating *</label>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: (hoverRating || rating) >= star ? '#eab308' : 'var(--color-muted)' }}
              aria-label={`Rate ${star} stars`}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="title" className="form-label">Review Title (Optional)</label>
        <input
          type="text"
          id="title"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summary of your experience"
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label htmlFor="body" className="form-label">Review *</label>
        <textarea
          id="body"
          className="form-input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike? What is this product best for?"
          rows={4}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
