'use client';

import Link from 'next/link';
import Image from 'next/image';

const categories = [
  { name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop', icon: '💻' },
  { name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=200&fit=crop', icon: '👗' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop', icon: '🏠' },
  { name: 'Books', slug: 'books', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=200&h=200&fit=crop', icon: '📚' },
  { name: 'Sports', slug: 'sports', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&h=200&fit=crop', icon: '⚽' },
  { name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop', icon: '✨' },
];

export default function CategoryGrid() {
  return (
    <div className="category-grid">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/products?category=${cat.slug}`}
          className="category-card"
          id={`category-${cat.slug}`}
          aria-label={`Browse ${cat.name}`}
        >
          <div className="category-card-icon">
            <Image
              src={cat.image}
              alt={cat.name}
              width={64}
              height={64}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              loading="lazy"
            />
          </div>
          <span className="category-card-name">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
