// ── Formatting ────────────────────────────────────────────────

export function formatPrice(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Pricing helpers ───────────────────────────────────────────

export function getDiscountPercent(comparePrice, price) {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export const SHIPPING_THRESHOLD = 50;
export const SHIPPING_COST = 5.99;
export const TAX_RATE = 0.08;

export function calculateShipping(subtotal) {
  if (subtotal >= SHIPPING_THRESHOLD) return 0;
  return SHIPPING_COST;
}

export function calculateTax(subtotal, rate = TAX_RATE) {
  return parseFloat((subtotal * rate).toFixed(2));
}

// ── Star ratings ──────────────────────────────────────────────

export function getRatingStars(rating) {
  const stars = [];
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push('full');
    else if (i === full && half) stars.push('half');
    else stars.push('empty');
  }
  return stars;
}

// ── Order status ──────────────────────────────────────────────

export function getStatusLabel(status) {
  const labels = {
    PENDING:    'Pending',
    PAID:       'Paid',
    PROCESSING: 'Processing',
    SHIPPED:    'Shipped',
    DELIVERED:  'Delivered',
    CANCELLED:  'Cancelled',
    REFUNDED:   'Refunded',
  };
  return labels[status] || status;
}

export function getStatusColor(status) {
  const colors = {
    PENDING:    'badge-warning',
    PAID:       'badge-success',
    PROCESSING: 'badge-info',
    SHIPPED:    'badge-info',
    DELIVERED:  'badge-success',
    CANCELLED:  'badge-error',
    REFUNDED:   'badge-neutral',
  };
  return colors[status] || 'badge-neutral';
}

// ── String helpers ────────────────────────────────────────────

export function truncate(str, length = 80) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '…' : str;
}

export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
