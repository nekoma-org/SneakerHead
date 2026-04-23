// sneakerhead/frontend-service/src/pages/OrderDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import useAuthStore from '../store/authStore';

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const justPlaced = location.state?.justPlaced;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const load = async () => {
      try {
        const res = await orderService.getOrder(id);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isAuthenticated]);

  if (loading) {
    return <div className="order-detail-page"><div className="loading-spinner">Loading...</div></div>;
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <h2>Order not found</h2>
        <Link to="/orders">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      {justPlaced && (
        <div className="order-success-banner">
          <span className="success-icon">🎉</span>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your purchase. Your order is being processed.</p>
        </div>
      )}

      <div className="order-detail-header">
        <div>
          <h1>Order #{order.id.slice(0, 8)}</h1>
          <span className="order-date">Placed on {new Date(order.created_at).toLocaleDateString()}</span>
        </div>
        <span className={`order-status-badge status-${order.status}`}>{order.status}</span>
      </div>

      <div className="order-detail-grid">
        <div className="order-detail-items">
          <h3>Items</h3>
          {order.items?.map((item) => (
            <div key={item.id} className="order-detail-item">
              <img src={item.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop'} alt={item.product_name} />
              <div className="item-info">
                <h4>{item.product_name}</h4>
                <span>Size: US {item.size}</span>
                <span>Qty: {item.quantity}</span>
                <span>₹{item.price.toFixed(2)} each</span>
              </div>
              <span className="item-total">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="order-detail-sidebar">
          <div className="order-summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>₹{order.subtotal.toFixed(2)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{order.shipping_fee === 0 ? 'Free' : `₹${order.shipping_fee.toFixed(2)}`}</span></div>
            <div className="summary-row"><span>Tax</span><span>₹{order.tax.toFixed(2)}</span></div>
            <div className="summary-row total"><span>Total</span><span>₹{order.total.toFixed(2)}</span></div>
          </div>

          {order.shipping_address && (
            <div className="order-address-card">
              <h3>Shipping Address</h3>
              <p>{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}</p>
              <p>{order.shipping_address.country}</p>
            </div>
          )}
        </div>
      </div>

      <div className="order-detail-actions">
        <Link to="/orders" className="back-link">← Back to Orders</Link>
        <Link to="/products" className="cta-btn">Continue Shopping</Link>
      </div>
    </div>
  );
}
