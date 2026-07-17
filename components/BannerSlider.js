'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  {
    id: 1,
    headline: 'Next-Gen Electronics',
    subline: 'Up to 40% off on laptops, earbuds, smartwatches and more. Limited time deals.',
    cta: 'Shop Electronics',
    href: '/products?category=electronics',
    bg: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&h=600&fit=crop&q=80',
    accent: '#A16207',
  },
  {
    id: 2,
    headline: 'Summer Fashion Drop',
    subline: 'Refresh your wardrobe with our latest collection. New arrivals every week.',
    cta: 'Explore Fashion',
    href: '/products?category=fashion',
    bg: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&h=600&fit=crop&q=80',
    accent: '#A16207',
  },
  {
    id: 3,
    headline: 'Transform Your Home',
    subline: 'Smart appliances and luxury home decor. Free shipping on orders over $50.',
    cta: 'Shop Home & Kitchen',
    href: '/products?category=home-kitchen',
    bg: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=600&fit=crop&q=80',
    accent: '#A16207',
  },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, paused]);

  const slide = slides[current];

  return (
    <section
      className="hero-slider"
      aria-label="Promotional banners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ position: 'relative', minHeight: '520px', overflow: 'hidden' }}>
        {/* Background image */}
        <Image
          src={slide.bg}
          alt={slide.headline}
          fill
          priority
          style={{ objectFit: 'cover', transition: 'opacity 0.8s ease' }}
          sizes="100vw"
        />
        {/* Overlay */}
        <div className="hero-overlay" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%)', position: 'absolute', inset: 0 }} />

        {/* Content */}
        <div className="hero-content">
          <div className="hero-text" style={{ animation: 'slideUp 0.6s ease' }}>
            <h2>{slide.headline}</h2>
            <p>{slide.subline}</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href={slide.href} className="btn btn-primary btn-lg" id={`banner-cta-${slide.id}`}>
                {slide.cta}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link href="/products" className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
                View All Deals
              </Link>
            </div>
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button className="slider-arrow slider-arrow-prev" onClick={prev} aria-label="Previous slide" id="banner-prev">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button className="slider-arrow slider-arrow-next" onClick={next} aria-label="Next slide" id="banner-next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        {/* Dots */}
        <div className="slider-dots" role="tablist" aria-label="Slide navigation">
          {slides.map((s, i) => (
            <button
              key={s.id}
              className={`slider-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to slide ${i + 1}`}
              id={`banner-dot-${i}`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
