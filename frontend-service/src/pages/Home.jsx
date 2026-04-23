// sneakerhead/frontend-service/src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, RotateCcw, Lock, TrendingUp, Zap, Sparkles, Dumbbell } from 'lucide-react';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';

// Custom SVG icons for categories not in Lucide
const BasketballIcon = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2.1 12h19.8" />
    <path d="M12 2.1v19.8" />
    <path d="M5.6 5.6c2.2 2.2 3.4 5 3.4 8.1s-1.2 5.9-3.4 8.1" />
    <path d="M18.4 5.6c-2.2 2.2-3.4 5-3.4 8.1s1.2 5.9 3.4 8.1" />
  </svg>
);

const SkateboardIcon = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="10" width="18" height="4" rx="2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <line x1="7" y1="14" x2="7" y2="15" />
    <line x1="17" y1="14" x2="17" y2="15" />
  </svg>
);

const BRANDS = [
  { name: 'Nike', logo: 'NK' },
  { name: 'Adidas', logo: 'AD' },
  { name: 'Jordan', logo: 'JD' },
  { name: 'New Balance', logo: 'NB' },
  { name: 'Puma', logo: 'PM' },
  { name: 'Asics', logo: 'AS' },
];

const CATEGORIES = [
  { name: 'Running', icon: Zap, color: '#e8ff00' },
  { name: 'Basketball', icon: BasketballIcon, color: '#ff6b35' },
  { name: 'Lifestyle', icon: Sparkles, color: '#a855f7' },
  { name: 'Skate', icon: SkateboardIcon, color: '#06b6d4' },
  { name: 'Training', icon: Dumbbell, color: '#22c55e' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featuredRes, trendingRes] = await Promise.all([
          productService.getFeatured(4),
          productService.getProducts({ sort_by: 'popular', limit: 8 }),
        ]);
        setFeatured(featuredRes.data);
        setTrending(trendingRes.data.products || []);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1556906781-9348caca9b23?w=1400&h=700&fit=crop&auto=format"
            alt="Sneaker collection"
            className="hero-bg-img"
          />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge"><TrendingUp size={14} /> NEW SEASON 2024</div>
          <h1 className="hero-title">
            STEP INTO<br />THE <span className="accent">CULTURE</span>
          </h1>
          <p className="hero-subtitle">
            Discover the latest drops from the world's most iconic sneaker brands.
            Authentic. Premium. Delivered to your door.
          </p>
          <div className="hero-ctas">
            <Link to="/products" className="hero-cta">
              Shop Now <ArrowRight size={20} />
            </Link>
            <Link to="/products?sort_by=newest" className="hero-cta-secondary">
              Latest Drops
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-shoe-container">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop&auto=format"
              alt="Featured sneaker"
              className="hero-shoe-img"
            />
            <div className="hero-glow"></div>
          </div>
        </div>
      </section>

      {/* Brand Carousel */}
      <section className="brand-carousel">
        <div className="carousel-track">
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <Link
              key={i}
              to={`/products?brand=${brand.name}`}
              className="brand-item"
            >
              <span className="brand-logo">{brand.logo}</span>
              <span className="brand-name">{brand.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Drops */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Latest <span className="accent">Drops</span></h2>
          <Link to="/products?sort_by=newest" className="section-link">View All <ArrowRight size={16} /></Link>
        </div>
        <div className="product-grid-4">
          {loading
            ? Array(4).fill(0).map((_, i) => <div key={i} className="product-skeleton" />)
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Category Tiles */}
      <section className="section">
        <h2 className="section-title">Shop by <span className="accent">Category</span></h2>
        <div className="category-tiles">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className="category-tile"
              style={{ '--tile-color': cat.color }}
            >
              <cat.icon size={32} color={cat.color} className="cat-icon" />
              <span className="cat-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Trending <span className="accent">Now</span></h2>
          <Link to="/products?sort_by=popular" className="section-link">See More <ArrowRight size={16} /></Link>
        </div>
        <div className="trending-scroll">
          {trending.map((p) => (
            <div key={p.id} className="trending-item">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Trust Banner */}
      <section className="trust-banner">
        <div className="trust-item">
          <Shield size={28} className="trust-icon" />
          <span>100% Authentic</span>
        </div>
        <div className="trust-item">
          <RotateCcw size={28} className="trust-icon" />
          <span>Free Returns</span>
        </div>
        <div className="trust-item">
          <Lock size={28} className="trust-icon" />
          <span>Secure Checkout</span>
        </div>
      </section>
    </div>
  );
}
