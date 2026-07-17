'use client';

import { useEffect, useState } from 'react';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import Image from 'next/image';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card card-padded">
            <div className="skeleton" style={{ height: '1.25rem', width: '50%', marginBottom: '0.75rem' }} />
            <div className="skeleton" style={{ height: '1rem', width: '30%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card card-padded">
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <div className="empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h3>No orders yet</h3>
          <p>When you place orders, they&apos;ll appear here.</p>
          <a href="/products" className="btn btn-primary">Start Shopping</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>My Orders</h1>
      {orders.map((order) => (
        <div key={order.id} className="card">
          {/* Order header */}
          <div
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '0.75rem' }}
            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            role="button"
            tabIndex={0}
            aria-expanded={expanded === order.id}
            onKeyDown={(e) => e.key === 'Enter' && setExpanded(expanded === order.id ? null : order.id)}
            id={`order-${order.id}`}
          >
            <div>
              <p style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '0.25rem' }}>
                Order #{order.orderNumber}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className={`badge ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
              <span style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{formatPrice(order.total)}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded === order.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--color-muted)' }} aria-hidden="true">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {/* Expanded items */}
          {expanded === order.id && (
            <div style={{ borderTop: '1px solid var(--color-border)', padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {item.product?.images?.[0]?.url && (
                      <div style={{ width: '56px', height: '56px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-2)' }}>
                        <Image src={item.product.images[0].url} alt={item.name} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{item.name}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>Qty: {item.quantity} · {formatPrice(item.price)} each</p>
                    </div>
                    <span style={{ fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                <div>
                  <p><strong>Ship to:</strong> {order.shippingName}</p>
                  <p>{order.shippingStreet}, {order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>Subtotal: {formatPrice(order.subtotal)}</p>
                  <p>Shipping: {order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</p>
                  <p>Tax: {formatPrice(order.tax)}</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-foreground)', marginTop: '0.25rem' }}>Total: {formatPrice(order.total)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
