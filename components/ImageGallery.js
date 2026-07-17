'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ImageGallery({ images, productName }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div style={{
        aspectRatio: '1',
        background: 'var(--color-surface-2)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-muted)',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div style={{
        position: 'relative',
        aspectRatio: '1',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        background: 'var(--color-surface-2)',
        marginBottom: '1rem',
        border: '1px solid var(--color-border)',
      }}>
        <Image
          src={images[activeIndex]?.url}
          alt={images[activeIndex]?.alt || `${productName} image ${activeIndex + 1}`}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'cover', transition: 'opacity 0.2s ease' }}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === activeIndex}
              id={`img-thumb-${i}`}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: `2px solid ${i === activeIndex ? 'var(--color-accent)' : 'var(--color-border)'}`,
                padding: 0,
                cursor: 'pointer',
                background: 'var(--color-surface-2)',
                transition: 'border-color 0.15s ease',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <Image
                src={img.url}
                alt={img.alt || `Thumbnail ${i + 1}`}
                fill
                sizes="72px"
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
