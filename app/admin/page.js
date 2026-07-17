'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';

function StatCard({ label, value, icon, colorClass, change }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon.split('|').map((d, i) => <path key={i} d={d} />)}
        </svg>
      </div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
        {change && <p className={`stat-change ${change.startsWith('+') ? 'up' : 'down'}`}>{change} vs last month</p>}
      </div>
    </div>
  );
}

// Tiny bar chart rendered with CSS
function BarChart({ labels, values }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '120px', padding: '0 0.5rem' }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.625rem', color: 'var(--color-muted)', fontWeight: 600 }}>
            {v > 0 ? `$${v}` : ''}
          </span>
          <div
            style={{
              width: '100%',
              height: `${Math.max((v / max) * 80, v > 0 ? 6 : 2)}px`,
              background: v > 0 ? 'var(--color-accent)' : 'var(--color-border)',
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.5s ease',
              minHeight: '2px',
            }}
            title={`${labels[i]}: $${v}`}
          />
          <span style={{ fontSize: '0.625rem', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.2 }}>
            {labels[i]?.split(',')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="stats-grid">
          {[1,2,3,4].map((i) => <div key={i} className="stat-card"><div className="skeleton" style={{ height: '5rem', flex: 1 }} /></div>)}
        </div>
      </div>
    );
  }

  const { stats, recentOrders, lowStockProducts, chart } = data || {};

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Revenue" value={formatPrice(stats?.totalRevenue || 0)} icon="M12 2v20|M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" colorClass="stat-icon-gold" change={stats?.revenueChange} />
        <StatCard label="Total Orders" value={(stats?.totalOrders || 0).toLocaleString()} icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6" colorClass="stat-icon-blue" change={stats?.ordersChange} />
        <StatCard label="Total Customers" value={(stats?.totalUsers || 0).toLocaleString()} icon="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" colorClass="stat-icon-green" change={stats?.usersChange} />
        <StatCard label="Total Products" value={(stats?.totalProducts || 0).toLocaleString()} icon="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z|M3 6h18" colorClass="stat-icon-purple" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Revenue chart */}
        <div className="table-container">
          <div className="table-header">
            <h2 className="table-title">Revenue (Last 7 Days)</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {chart ? (
              <BarChart labels={chart.labels} values={chart.revenue} />
            ) : (
              <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '2rem' }}>No data yet</p>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="table-container">
          <div className="table-header">
            <h2 className="table-title">Low Stock Alert</h2>
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            {lowStockProducts?.length > 0 ? lowStockProducts.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1, marginRight: '0.75rem' }} className="truncate">{p.name}</span>
                <span className={`badge ${p.stock === 0 ? 'badge-error' : 'badge-warning'}`}>{p.stock} left</span>
              </div>
            )) : (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', padding: '1.5rem', textAlign: 'center' }}>All products well-stocked</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Recent Orders</h2>
          <Link href="/admin/orders" className="btn btn-outline btn-sm" id="admin-view-all-orders">View All</Link>
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
              </tr>
            </thead>
            <tbody>
              {recentOrders?.length > 0 ? recentOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-heading)' }}>{order.orderNumber}</td>
                  <td>
                    <p style={{ fontWeight: 500 }}>{order.user?.name}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>{order.user?.email}</p>
                  </td>
                  <td>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(order.total)}</td>
                  <td><span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span></td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{formatDateTime(order.createdAt)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
