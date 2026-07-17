'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
    ],
  },
  {
    label: 'Store',
    items: [
      { href: '/admin/products', label: 'Products', icon: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0' },
      { href: '/admin/orders', label: 'Orders', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/', label: 'View Store', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar-logo">
        <Link href="/admin">Nova<span>Mart</span> <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: '0.25rem' }}>Admin</span></Link>
      </div>

      <nav className="admin-nav">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="admin-nav-label">{section.label}</p>
            {section.items.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item${active ? ' active' : ''}`}
                  id={`admin-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {item.icon.split(' ').map((d, i) => <path key={i} d={d} />)}
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            className="admin-nav-item"
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{ color: 'rgba(239,68,68,0.8)', width: '100%' }}
            id="admin-signout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </nav>
    </aside>
  );
}
