// sneakerhead/frontend-service/src/components/CartDrawer.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import useCartStore from '../store/cartStore';

export default function CartDrawer() {
  const {
    items,
    subtotal,
    shipping_fee,
    tax,
    total,
    drawerOpen,
    setDrawerOpen,
    updateQuantity,
    removeItem,
  } = useCartStore();
  const navigate = useNavigate();

  if (!drawerOpen) return null;

  const handleCheckout = () => {
    setDrawerOpen(false);
    navigate('/checkout');
  };

  const handleViewCart = () => {
    setDrawerOpen(false);
    navigate('/cart');
  };

  return (
    <>
      <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      <div className="cart-drawer">
        <div className="drawer-header">
          <h2>Your Cart ({items.length})</h2>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="drawer-items">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <ShoppingCart size={48} className="empty-icon" />
              <p>Your cart is empty</p>
              <Link to="/products" onClick={() => setDrawerOpen(false)} className="continue-shopping">
                Continue Shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="drawer-item">
                <img
                  src={item.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop'}
                  alt={item.product_name}
                />
                <div className="drawer-item-info">
                  <h4>{item.product_name}</h4>
                  <span className="drawer-item-size">Size: {item.size}</span>
                  <span className="drawer-item-price">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <div className="drawer-item-qty">
                    <button
                      onClick={() =>
                        item.quantity > 1
                          ? updateQuantity(item.id, item.quantity - 1)
                          : removeItem(item.id)
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button
                  className="drawer-item-remove"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-totals">
              <div className="drawer-total-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="drawer-total-row">
                <span>Shipping</span>
                <span>{shipping_fee === 0 ? 'Free' : `₹${shipping_fee.toFixed(2)}`}</span>
              </div>
              <div className="drawer-total-row total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
              Checkout
            </button>
            <button className="view-cart-btn" onClick={handleViewCart}>
              View Full Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
