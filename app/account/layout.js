'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/account', label: 'My Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { href: '/account/orders', label: 'My Orders', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { href: '/account/addresses', label: 'Addresses', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
];

export default function AccountLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="container section">
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Sidebar */}
        <aside>
          <div className="card card-padded" style={{ position: 'sticky', top: 'calc(var(--nav-height) + 1rem)' }}>
            {session?.user && (
              <div style={{ textAlign: 'center', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-heading)' }}>
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-foreground)' }}>{session.user.name}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>{session.user.email}</p>
              </div>
            )}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
                      fontSize: '0.9375rem', fontWeight: active ? 600 : 400,
                      color: active ? 'var(--color-accent)' : 'var(--color-secondary)',
                      background: active ? 'var(--color-accent-light)' : 'transparent',
                      transition: 'all 0.15s', textDecoration: 'none',
                    }}
                    id={`account-nav-${item.href.split('/').pop() || 'profile'}`}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {item.icon.split(' ').map((d, i) => <path key={i} d={d} />)}
                    </svg>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
