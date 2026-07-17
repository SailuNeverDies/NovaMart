import AdminSidebar from '@/components/AdminSidebar';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Admin Dashboard | NovaMart' };

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') redirect('/');

  return (
    <div className="admin-layout" style={{ paddingTop: 0 }}>
      <AdminSidebar />
      <div className="admin-content">
        <header className="admin-header">
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            Logged in as <strong>{session.user.name}</strong> · Admin
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View Store
            </a>
          </div>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
