'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { formatPrice, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';

const STATUSES = ['', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/orders?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function updateStatus(orderId, status) {
    setUpdating(orderId);
    await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    await loadOrders();
    setUpdating(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Orders</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label htmlFor="status-filter" style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Filter:</label>
          <select
            id="status-filter"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || 'All Orders'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">
            {statusFilter ? `${getStatusLabel(statusFilter)} Orders` : 'All Orders'} ({orders.length})
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>No orders found</td></tr>
              ) : orders.map((order) => (
                <Fragment key={order.id}>
                  <tr
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{order.orderNumber}</td>
                    <td>
                      <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{order.user?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{order.user?.email}</p>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(order.total)}</td>
                    <td>
                      <span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>{formatDateTime(order.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="form-select"
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updating === order.id}
                        style={{ width: '140px', fontSize: '0.8125rem', padding: '0.375rem 0.625rem' }}
                        aria-label={`Update status for order ${order.orderNumber}`}
                        id={`status-${order.id}`}
                      >
                        {STATUSES.filter(Boolean).map((s) => (
                          <option key={s} value={s}>{getStatusLabel(s)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`${order.id}-detail`} style={{ background: 'var(--color-surface-2)' }}>
                      <td colSpan={7} style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div>
                            <p style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Items Ordered</p>
                            {order.items?.map((item) => (
                              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.375rem 0', borderBottom: '1px solid var(--color-border)' }}>
                                <span>{item.name} × {item.quantity}</span>
                                <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Shipping Address</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', lineHeight: 1.7 }}>
                              {order.shippingName}<br />
                              {order.shippingStreet}<br />
                              {order.shippingCity}, {order.shippingState} {order.shippingZip}<br />
                              {order.shippingCountry}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
