'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  function handleQtyChange(delta) {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      removeItem(item.productId);
    } else if (newQty <= item.stock) {
      updateQuantity(item.productId, newQty);
    }
  }

  return (
    <div className="cart-item">
      {/* Image */}
      <Link href={`/products/${item.productId}`} className="cart-item-image" aria-label={item.name}>
        <Image
          src={item.image || 'https://placehold.co/80x80?text=No+Image'}
          alt={item.name}
          width={80}
          height={80}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      </Link>

      {/* Details */}
      <div className="cart-item-details">
        <Link href={`/products/${item.productId}`} style={{ textDecoration: 'none' }}>
          <h3 className="cart-item-name">{item.name}</h3>
        </Link>
        <p className="cart-item-price">{formatPrice(item.price)} each</p>

        {/* Quantity control */}
        <div className="qty-control" role="group" aria-label={`Quantity for ${item.name}`}>
          <button
            className="qty-btn"
            onClick={() => handleQtyChange(-1)}
            aria-label="Decrease quantity"
            id={`qty-dec-${item.productId}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <span className="qty-display" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
          <button
            className="qty-btn"
            onClick={() => handleQtyChange(1)}
            disabled={item.quantity >= item.stock}
            aria-label="Increase quantity"
            id={`qty-inc-${item.productId}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <button
          className="cart-remove-btn"
          onClick={() => removeItem(item.productId)}
          aria-label={`Remove ${item.name} from cart`}
          id={`remove-${item.productId}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Remove
        </button>
      </div>

      {/* Line total */}
      <div className="cart-item-total" aria-label={`Total for ${item.name}`}>
        {formatPrice(item.price * item.quantity)}
      </div>
    </div>
  );
}
