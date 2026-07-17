'use client';

import { useState, useEffect } from 'react';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', street: '', city: '', state: '', zip: '', country: 'US', isDefault: false });
  const [saving, setSaving] = useState(false);

  async function loadAddresses() {
    const res = await fetch('/api/addresses');
    const data = await res.json();
    setAddresses(data.addresses || []);
    setLoading(false);
  }

  useEffect(() => { loadAddresses(); }, []);

  function openAdd() { setForm({ fullName: '', phone: '', street: '', city: '', state: '', zip: '', country: 'US', isDefault: false }); setEditId(null); setShowForm(true); }
  function openEdit(addr) { setForm({ ...addr }); setEditId(addr.id); setShowForm(true); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const method = editId ? 'PUT' : 'POST';
    const body = editId ? { id: editId, ...form } : form;
    await fetch('/api/addresses', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    await loadAddresses();
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this address?')) return;
    await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
    await loadAddresses();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem' }}>Saved Addresses</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd} id="addr-add">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Address
        </button>
      </div>

      {showForm && (
        <div className="card card-padded">
          <h2 style={{ fontSize: '1.0625rem', marginBottom: '1.25rem' }}>{editId ? 'Edit' : 'New'} Address</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="addr-name">Full Name *</label>
                <input id="addr-name" className="form-input" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="addr-phone">Phone *</label>
                <input id="addr-phone" className="form-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="addr-street">Street *</label>
              <input id="addr-street" className="form-input" value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="addr-city">City *</label>
                <input id="addr-city" className="form-input" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="addr-state">State *</label>
                <input id="addr-state" className="form-input" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="addr-zip">ZIP *</label>
                <input id="addr-zip" className="form-input" value={form.zip} onChange={(e) => setForm((p) => ({ ...p, zip: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="addr-country">Country</label>
                <select id="addr-country" className="form-select" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                </select>
              </div>
            </div>
            <label className="filter-option">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} id="addr-default" />
              Set as default address
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} id="addr-save">{saving ? 'Saving...' : 'Save Address'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} id="addr-cancel">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card card-padded"><div className="skeleton" style={{ height: '5rem' }} /></div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="card card-padded" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>No saved addresses yet.</p>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>Add Your First Address</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {addresses.map((addr) => (
            <div key={addr.id} className="card card-padded" style={{ position: 'relative', border: addr.isDefault ? '2px solid var(--color-accent)' : undefined }}>
              {addr.isDefault && <span className="badge badge-accent" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>Default</span>}
              <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{addr.fullName}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-secondary)', lineHeight: 1.7 }}>
                {addr.street}<br/>{addr.city}, {addr.state} {addr.zip}<br/>{addr.country}<br/>{addr.phone}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(addr)} id={`addr-edit-${addr.id}`}>Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(addr.id)} style={{ color: 'var(--color-destructive)' }} id={`addr-del-${addr.id}`}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
