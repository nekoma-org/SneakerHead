// sneakerhead/frontend-service/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, User, LogOut, Package } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items, setDrawerOpen } = useCartStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">SH</span>
          <span className="brand-text">SNEAKER<span className="accent">HEAD</span></span>
        </Link>

        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search sneakers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" aria-label="Search">
            <Search size={18} />
          </button>
        </form>

        <div className="navbar-links">
          <Link to="/products" className="nav-link">Shop</Link>

          {isAuthenticated ? (
            <>
              <Link to="/orders" className="nav-link"><Package size={16} /> Orders</Link>
              <Link to="/profile" className="nav-link"><User size={16} /> Profile</Link>
              <button onClick={handleLogout} className="nav-link nav-btn"><LogOut size={16} /> Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link nav-btn-accent">Sign Up</Link>
            </>
          )}

          <button
            className="cart-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open cart"
          >
            <ShoppingBag size={22} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>
        </div>

        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/products" onClick={() => setMenuOpen(false)}>Shop</Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
          <button onClick={() => { setDrawerOpen(true); setMenuOpen(false); }}>
            Cart ({itemCount})
          </button>
        </div>
      )}
    </nav>
  );
}
