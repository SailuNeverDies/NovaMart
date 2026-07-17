'use client';

import { useWishlist } from '@/contexts/WishlistContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function WishlistButton({ productId, productName, className = '', size = 20 }) {
  const { data: session } = useSession();
  const { isWishlisted, toggleWishlist, isPending } = useWishlist();
  const router = useRouter();
  const addToast = useToast();

  const wishlisted = isWishlisted(productId);
  const pending = isPending(productId);

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const result = await toggleWishlist(productId);

    if (result === true) {
      addToast({ type: 'success', title: 'Saved to Wishlist', message: productName });
    } else if (result === false) {
      addToast({ type: 'info', title: 'Removed from Wishlist', message: productName });
    }
  }

  return (
    <button
      className={`wishlist-btn${wishlisted ? ' wishlisted' : ''}${className ? ` ${className}` : ''}`}
      onClick={handleClick}
      disabled={pending}
      aria-label={wishlisted ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      aria-pressed={wishlisted}
      id={`wishlist-${productId}`}
      title={wishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={wishlisted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          transition: 'transform 0.2s ease, fill 0.2s ease',
          transform: pending ? 'scale(0.85)' : wishlisted ? 'scale(1.15)' : 'scale(1)',
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
