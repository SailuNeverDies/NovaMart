'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const MiniCartContext = createContext(null);

export function MiniCartProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((o) => !o), []);

  return (
    <MiniCartContext.Provider value={{ isOpen, openCart, closeCart, toggleCart }}>
      {children}
    </MiniCartContext.Provider>
  );
}

export function useMiniCart() {
  const ctx = useContext(MiniCartContext);
  if (!ctx) throw new Error('useMiniCart must be used within MiniCartProvider');
  return ctx;
}
