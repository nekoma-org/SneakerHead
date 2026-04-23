// sneakerhead/frontend-service/src/pages/OrderHistory.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import useAuthStore from '../store/authStore';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const load = async () => {
      try {
        const res = await orderService.getOrders();
        setOrders(res.data || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  if (loading) {
    return <div className="order-history-page"><div className="loading-spinner">Loading orders...</div></div>;
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-page">
        <div className="empty-orders">
          <span className="empty-icon">📦</span>
          <h2>No orders yet</h2>
          <p>Your order history will appear here after your first purchase.</p>
          <Link to="/products" className="cta-btn">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <h1 className="page-title">Order History</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-card-header" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
              <div className="order-meta">
                <span className="order-id">#{order.id.slice(0, 8)}</span>
                <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <span className="order-status" style={{ backgroundColor: STATUS_COLORS[order.status] || '#666' }}>
                {order.status}
              </span>
              <div className="order-thumbs">
                {order.items?.slice(0, 3).map((item, i) => (
                  <img key={i} src={item.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=40&h=40&fit=crop'} alt="" className="order-thumb" />
                ))}
                {order.items?.length > 3 && <span className="more-items">+{order.items.length - 3}</span>}
              </div>
              <span className="order-total">₹{order.total.toFixed(2)}</span>
              <span className="expand-icon">{expandedOrder === order.id ? '▲' : '▼'}</span>
            </div>

            {expandedOrder === order.id && (
              <div className="order-card-expanded">
                {order.items?.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <img src={item.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60&h=60&fit=crop'} alt={item.product_name} />
                    <div className="order-item-info">
                      <span className="item-name">{item.product_name}</span>
                      <span>Size: {item.size} × {item.quantity}</span>
                    </div>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Link to={`/orders/${order.id}`} className="view-detail-link">View Full Details →</Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
