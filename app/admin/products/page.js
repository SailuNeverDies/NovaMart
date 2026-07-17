'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';

const EMPTY_FORM = { name: '', description: '', price: '', comparePrice: '', stock: '', brand: '', categoryId: '', tags: '', images: '', featured: false };

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const CATEGORIES = [
  { label: 'Electronics', value: 'electronics' },
  { label: 'Fashion', value: 'fashion' },
  { label: 'Home & Kitchen', value: 'home-kitchen' },
  { label: 'Books', value: 'books' },
  { label: 'Sports & Fitness', value: 'sports' },
  { label: 'Beauty', value: 'beauty' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/products?limit=50&sort=newest${debouncedSearch ? `&search=${debouncedSearch}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        const cats = Array.isArray(data) ? data : (data.categories || []);
        if (cats.length > 0) {
          setCategories(cats.map((c) => ({ label: c.name, value: c.slug || c.id })));
        } else {
          setCategories(CATEGORIES);
        }
      })
      .catch(() => setCategories(CATEGORIES));
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDeleteConfirm(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditProduct(null);
    setError('');
    setShowModal(true);
  }

  function openEdit(product) {
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price || ''),
      comparePrice: String(product.comparePrice || ''),
      stock: String(product.stock || ''),
      brand: product.brand || '',
      categoryId: product.categoryId || '',
      tags: product.tags || '',
      images: product.images?.map((i) => i.url).join('\n') || '',
      featured: product.featured || false,
    });
    setEditProduct(product);
    setError('');
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) {
      setError('Name, price, and category are required.'); return;
    }
    setSaving(true); setError('');

    // Resolve categoryId from slug
    let resolvedCategoryId = form.categoryId;
    try {
      const catRes = await fetch(`/api/products?category=${form.categoryId}&limit=1`);
      // We'll send slug as categoryId; the API resolves it
    } catch { /* ignore */ }

    // Fetch actual category ID from DB
    const catLookupRes = await fetch(`/api/categories?slug=${form.categoryId}`).catch(() => null);
    if (catLookupRes?.ok) {
      const catData = await catLookupRes.json();
      if (catData.id) resolvedCategoryId = catData.id;
    }

    const payload = {
      ...form,
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      stock: parseInt(form.stock) || 0,
      categoryId: resolvedCategoryId,
      images: form.images ? form.images.split('\n').map((u) => u.trim()).filter(Boolean) : [],
    };

    const method = editProduct ? 'PUT' : 'POST';
    const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) { setError(data.error || 'Failed to save product'); setSaving(false); return; }
    await loadProducts();
    setSaving(false);
    setShowModal(false);
  }

  async function confirmDelete(id) {
    setDeleteError('');
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(`Failed to delete product: ${data.error || 'Unknown error'}`);
    } else {
      await loadProducts();
    }
    setShowDeleteConfirm(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Products</h1>
        <button className="btn btn-primary" onClick={openAdd} id="admin-add-product">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Product
        </button>
      </div>

      {deleteError && (
        <div style={{ background: '#fee2e2', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#991b1b', fontSize: '0.875rem' }}>{deleteError}</div>
      )}

      {/* Search */}
      <div className="table-container" style={{ marginBottom: '1.5rem' }}>
        <div className="table-header">
          <h2 className="table-title">All Products ({products.length})</h2>
          <input
            className="form-input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '280px' }}
            id="admin-product-search"
            aria-label="Search products"
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadError ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-destructive)' }}>{loadError}</td></tr>
              ) : loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>No products found</td></tr>
              ) : products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.images?.[0]?.url && (
                        <div style={{ width: '44px', height: '44px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-2)' }}>
                          <Image src={p.images[0].url} alt={p.name} width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{p.category?.name}</td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(p.price)}</td>
                  <td>
                    <span className={`badge ${p.stock === 0 ? 'badge-error' : p.stock <= 10 ? 'badge-warning' : 'badge-success'}`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td>
                    {p.featured && <span className="badge badge-accent">Featured</span>}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)} id={`edit-prod-${p.id}`}>Edit</button>
                      {showDeleteConfirm === p.id ? (
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-destructive)' }}>Sure?</span>
                          <button className="btn btn-sm btn-primary" onClick={() => confirmDelete(p.id)} style={{ padding: '0 0.5rem' }}>Yes</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setShowDeleteConfirm(null)} style={{ padding: '0 0.5rem' }}>No</button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(p.id)} style={{ color: 'var(--color-destructive)' }} id={`del-prod-${p.id}`}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close modal" id="modal-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#991b1b', fontSize: '0.875rem' }}>{error}</div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-name">Product Name *</label>
                  <input id="prod-name" className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-brand">Brand</label>
                  <input id="prod-brand" className="form-input" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-desc">Description *</label>
                <textarea id="prod-desc" className="form-textarea" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-price">Price (USD) *</label>
                  <input id="prod-price" type="number" step="0.01" min="0" className="form-input" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-compare">Compare Price (original)</label>
                  <input id="prod-compare" type="number" step="0.01" min="0" className="form-input" value={form.comparePrice} onChange={(e) => setForm((p) => ({ ...p, comparePrice: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-stock">Stock Quantity *</label>
                  <input id="prod-stock" type="number" min="0" className="form-input" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-cat">Category *</label>
                  <select id="prod-cat" className="form-select" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} required>
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-tags">Tags (comma-separated)</label>
                  <input id="prod-tags" className="form-input" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="wireless, bluetooth, audio" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-images">Image URLs (one per line)</label>
                <textarea id="prod-images" className="form-textarea" value={form.images} onChange={(e) => setForm((p) => ({ ...p, images: e.target.value }))} placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" rows={3} />
              </div>

              <label className="filter-option">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} id="prod-featured" />
                Mark as Featured Product
              </label>

              <div className="modal-footer" style={{ marginTop: 0, paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} id="prod-save">
                  {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
