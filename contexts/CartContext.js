'use client';

import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const CartContext = createContext(null);

// Cart actions
const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
};

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD_CART:
      return { ...state, items: action.payload, loaded: true };

    case ACTIONS.ADD_ITEM: {
      const existingIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingIndex >= 0) {
        const updated = [...state.items];
        const newQuantity = updated[existingIndex].quantity + (action.payload.quantity || 1);
        if (newQuantity <= 0) {
          return { ...state, items: state.items.filter((item) => item.productId !== action.payload.productId) };
        }
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQuantity, updated[existingIndex].stock),
        };
        return { ...state, items: updated };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: Math.min(action.payload.quantity || 1, action.payload.stock) }],
      };
    }

    case ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== action.payload),
      };

    case ACTIONS.UPDATE_QUANTITY: {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.productId !== action.payload.productId),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === action.payload.productId
            ? { ...item, quantity: Math.min(action.payload.quantity, item.stock) }
            : item
        ),
      };
    }

    case ACTIONS.CLEAR_CART:
      return { ...state, items: [] };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const { data: session, status } = useSession();
  const [state, dispatch] = useReducer(cartReducer, { items: [], loaded: false });

  const CART_STORAGE_KEY = 'novamart_cart_' + (session?.user?.id || 'guest');

  // Load cart from localStorage on mount
  useEffect(() => {
    if (status === 'loading') return;
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        dispatch({ type: ACTIONS.LOAD_CART, payload: JSON.parse(stored) });
      } else {
        dispatch({ type: ACTIONS.LOAD_CART, payload: [] });
      }
    } catch {
      dispatch({ type: ACTIONS.LOAD_CART, payload: [] });
    }
  }, [CART_STORAGE_KEY, status]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (state.loaded && status !== 'loading') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    }
  }, [state.items, state.loaded, CART_STORAGE_KEY, status]);

  const addItem = useCallback((product, quantity = 1) => {
    if (quantity <= 0) return;
    dispatch({
      type: ACTIONS.ADD_ITEM,
      payload: {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url || '',
        stock: product.stock,
        quantity,
      },
    });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: productId });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({ type: ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CART });
  }, []);

  // Computed values
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;

  const value = {
    items: state.items,
    itemCount,
    subtotal,
    loaded: state.loaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
