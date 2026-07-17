'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [form, setForm] = useState({ name: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (session?.user?.name) setForm((p) => ({ ...p, name: session.user.name }));
  }, [session]);

  async function handleSave(e) {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' }); return;
    }
    setSaving(true); setMessage(null);
    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await update({ name: data.user.name });
      setForm((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card card-padded">
        <h1 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>My Profile</h1>
        {message && (
          <div style={{ background: message.type === 'success' ? '#d1fae5' : '#fee2e2', border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`, borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: message.type === 'success' ? '#065f46' : '#991b1b', fontSize: '0.875rem' }}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-name">Full Name</label>
            <input id="profile-name" className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" value={session?.user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <p className="form-hint">Email cannot be changed.</p>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem' }}>Change Password</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cur-pass">Current Password</label>
                <input id="cur-pass" type="password" className="form-input" value={form.currentPassword} onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="Leave blank to keep current" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-pass">New Password</label>
                  <input id="new-pass" type="password" className="form-input" value={form.newPassword} onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))} placeholder="At least 6 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-pass">Confirm New Password</label>
                  <input id="confirm-pass" type="password" className="form-input" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="submit" className="btn btn-primary" disabled={saving} id="profile-save">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
