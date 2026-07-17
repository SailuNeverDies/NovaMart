'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/contexts/CartContext';
import { useMiniCart } from '@/contexts/MiniCartContext';
import { useRouter, usePathname } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Navbar() {
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const { openCart } = useMiniCart();
  const router = useRouter();
  const pathname = usePathname();

  // User dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Search autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Sticky navbar scroll state
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  // ── Sticky scroll behaviour ───────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 10);
      if (y > lastScrollY.current && y > 80) {
        setHidden(true);   // scrolling DOWN → hide
      } else {
        setHidden(false);  // scrolling UP → show
      }
      lastScrollY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Close menus when clicking outside ─────────────────────────────────────
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) setMobileSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Close suggestions on route change ─────────────────────────────────────
  useEffect(() => {
    setSearchFocused(false);
    setMobileSearchOpen(false);
    setSuggestions([]);
    setSearchQuery('');
  }, [pathname]);

  // ── Fetch autocomplete suggestions ────────────────────────────────────────
  useEffect(() => {
    if (debouncedQuery.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    setSearchLoading(true);
    fetch(`/api/products/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setSuggestions(d.results || []); })
      .catch(() => { if (!cancelled) setSuggestions([]); })
      .finally(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
      setMobileSearchOpen(false);
    }
  }

  function handleSignOut() {
    setMenuOpen(false);
    signOut({ callbackUrl: '/' });
  }

  function selectSuggestion(id) {
    router.push(`/products/${id}`);
    setSearchFocused(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
  }

  const showDropdown = searchFocused && searchQuery.length >= 2;
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <nav
      className={`navbar${scrolled ? ' navbar--scrolled' : ''}${hidden ? ' navbar--hidden' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo" aria-label="NovaMart Home">
          Nova<span>Mart</span>
        </Link>

        {/* Search Bar with Autocomplete */}
        <div className="navbar-search" ref={searchRef}>
          <form onSubmit={handleSearch} role="search">
            <div className="search-input-wrap">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="search"
                placeholder="Search products, brands and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                aria-label="Search products"
                aria-autocomplete="list"
                aria-expanded={showDropdown}
                aria-controls="search-suggestions"
                id="navbar-search"
                autoComplete="off"
              />
              {searchLoading && (
                <svg className="search-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              )}
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="search-dropdown" id="search-suggestions" role="listbox" aria-label="Search suggestions">
              {suggestions.length === 0 && !searchLoading ? (
                <div className="search-dropdown-empty">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <span>No results for &quot;{searchQuery}&quot;</span>
                </div>
              ) : (
                <>
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      className="search-suggestion"
                      role="option"
                      onClick={() => selectSuggestion(product.id)}
                      id={`suggestion-${product.id}`}
                    >
                      {/* Product image */}
                      <div className="suggestion-image">
                        {product.images?.[0]?.url ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            fill
                            sizes="44px"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-2)' }} />
                        )}
                      </div>
                      {/* Details */}
                      <div className="suggestion-details">
                        <p className="suggestion-name">{product.name}</p>
                        <p className="suggestion-meta">{product.category?.name}</p>
                      </div>
                      {/* Price */}
                      <span className="suggestion-price">{formatPrice(product.price)}</span>
                    </button>
                  ))}
                  {/* View all results */}
                  <button
                    className="search-view-all"
                    onClick={() => { router.push(`/products?search=${encodeURIComponent(searchQuery)}`); setSearchFocused(false); }}
                    id="search-view-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    View all results for &quot;{searchQuery}&quot;
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Mobile Search Toggle */}
          <button className="navbar-icon-btn mobile-search-toggle" onClick={() => setMobileSearchOpen(true)} aria-label="Open search">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* Cart */}
          <button className="navbar-icon-btn" onClick={openCart} aria-label={`Shopping cart with ${itemCount} items`} id="navbar-cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {itemCount > 0 && (
              <span className="cart-badge" aria-label={`${itemCount} items in cart`}>
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>

          {/* User menu */}
          {session ? (
            <div className="navbar-user-menu" ref={menuRef}>
              <button
                className="navbar-icon-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="User menu"
                id="navbar-user-btn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </button>

              {menuOpen && (
                <div className="user-dropdown" role="menu">
                  <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-foreground)' }}>
                      {session.user.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                      {session.user.email}
                    </p>
                  </div>
                  <div className="divider" />
                  <Link href="/account" onClick={() => setMenuOpen(false)} role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    My Profile
                  </Link>
                  <Link href="/account/orders" onClick={() => setMenuOpen(false)} role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    My Orders
                  </Link>
                  {isAdmin && (
                    <>
                      <div className="divider" />
                      <Link href="/admin" onClick={() => setMenuOpen(false)} role="menuitem">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Admin Dashboard
                      </Link>
                    </>
                  )}
                  <div className="divider" />
                  <button onClick={handleSignOut} role="menuitem" style={{ color: 'var(--color-destructive)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/signin" className="btn btn-primary btn-sm" id="navbar-signin">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="mobile-search-overlay" ref={mobileSearchRef}>
          <div className="mobile-search-header">
            <form onSubmit={handleSearch} role="search" style={{ flex: 1 }}>
              <div className="search-input-wrap">
                <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  aria-label="Search products"
                  autoFocus
                />
              </div>
            </form>
            <button className="mobile-search-close" onClick={() => setMobileSearchOpen(false)} aria-label="Close search">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          
          {showDropdown && suggestions.length > 0 && (
            <div style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  className="search-suggestion"
                  onClick={() => selectSuggestion(product.id)}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <div className="suggestion-image">
                    {product.images?.[0]?.url ? (
                      <Image src={product.images[0].url} alt="" fill sizes="44px" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-2)' }} />
                    )}
                  </div>
                  <div className="suggestion-details">
                    <p className="suggestion-name">{product.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
