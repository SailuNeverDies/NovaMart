'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { data: session } = useSession();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState(new Set()); // IDs currently being toggled

  // Load wishlist on session change
  useEffect(() => {
    if (!session) { setWishlistIds(new Set()); return; }
    fetch('/api/wishlist')
      .then((r) => r.json())
      .then((d) => setWishlistIds(new Set(d.ids || [])))
      .catch(() => {});
  }, [session]);

  const toggleWishlist = useCallback(async (productId) => {
    if (!session) return false; // caller can redirect to sign-in
    if (pendingIds.has(productId)) return; // debounce rapid clicks

    // Optimistic update
    setPendingIds((p) => new Set([...p, productId]));
    const wasWishlisted = wishlistIds.has(productId);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (wasWishlisted) next.delete(productId); else next.add(productId);
      return next;
    });

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();

      // Sync with server response
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (data.wishlisted) next.add(productId); else next.delete(productId);
        return next;
      });

      return data.wishlisted;
    } catch {
      // Rollback on error
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.add(productId); else next.delete(productId);
        return next;
      });
      return wasWishlisted;
    } finally {
      setPendingIds((p) => { const next = new Set(p); next.delete(productId); return next; });
    }
  }, [session, wishlistIds, pendingIds]);

  const isWishlisted = useCallback((productId) => wishlistIds.has(productId), [wishlistIds]);
  const isPending = useCallback((productId) => pendingIds.has(productId), [pendingIds]);

  return (
    <WishlistContext.Provider value={{ isWishlisted, toggleWishlist, isPending, loading, count: wishlistIds.size }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
