// sneakerhead/frontend-service/src/pages/Cart.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';

export default function Cart() {
  const {
    items, subtotal, shipping_fee, tax, total,
    fetchCart, updateQuantity, removeItem,
  } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <span className="empty-icon">🔐</span>
          <h2>Please log in to view your cart</h2>
          <Link to="/login" className="cta-btn">Login</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <span className="empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any sneakers yet.</p>
          <Link to="/products" className="cta-btn">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="page-title">Shopping Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <img
                src={item.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop'}
                alt={item.product_name}
                className="cart-item-img"
              />
              <div className="cart-item-details">
                <h3>{item.product_name}</h3>
                <span className="cart-item-size">Size: US {item.size}</span>
                <span className="cart-item-unit-price">₹{item.price.toFixed(2)} each</span>
              </div>
              <div className="cart-item-qty">
                <button
                  onClick={() =>
                    item.quantity > 1
                      ? updateQuantity(item.id, item.quantity - 1)
                      : removeItem(item.id)
                  }
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <span className="cart-item-total">₹{(item.price * item.quantity).toFixed(2)}</span>
              <button
                className="cart-item-remove"
                onClick={() => removeItem(item.id)}
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping_fee === 0 ? 'Free' : `₹${shipping_fee.toFixed(2)}`}</span>
          </div>
          {shipping_fee > 0 && (
            <p className="free-shipping-note">Free shipping on orders over ₹15,000</p>
          )}
          <div className="summary-row">
            <span>Tax (8%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>

          <div className="promo-code">
            <input type="text" placeholder="Promo code" />
            <button>Apply</button>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button className="checkout-btn" onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
          <Link to="/products" className="continue-link">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
