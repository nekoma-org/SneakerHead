// sneakerhead/frontend-service/src/components/Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Twitter, Instagram, Facebook, Youtube } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h3 className="footer-brand">
            <span className="brand-icon">SH</span> SNEAKER<span className="accent">HEAD</span>
          </h3>
          <p className="footer-desc">
            Your premium destination for authentic sneakers from the world's top brands.
          </p>
          <div className="social-icons">
            <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="YouTube"><Youtube size={18} /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/products?category=Running">Running</Link>
          <Link to="/products?category=Basketball">Basketball</Link>
          <Link to="/products?category=Lifestyle">Lifestyle</Link>
          <Link to="/products?category=Skate">Skate</Link>
          <Link to="/products?category=Training">Training</Link>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <a href="#">About Us</a>
          <a href="#">Careers</a>
          <a href="#">Press</a>
          <a href="#">Contact</a>
        </div>

        <div className="footer-col">
          <h4>Newsletter</h4>
          <p className="newsletter-desc">Get the latest drops and exclusive offers.</p>
          {subscribed ? (
            <p className="subscribe-success">✓ Subscribed!</p>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit"><Send size={16} /></button>
            </form>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2024 SneakerHead. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Shipping Info</a>
        </div>
      </div>
    </footer>
  );
}
