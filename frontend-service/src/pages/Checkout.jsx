// sneakerhead/frontend-service/src/pages/Checkout.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import orderService from '../services/orderService';

const STEPS = ['Shipping', 'Payment', 'Review'];

export default function Checkout() {
  const { items, subtotal, shipping_fee, tax, total, fetchCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const [shipping, setShipping] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'India',
  });

  const [payment, setPayment] = useState({
    card_number: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  const handleShippingChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e) => {
    setPayment({ ...payment, [e.target.name]: e.target.value });
  };

  const canProceedShipping = shipping.full_name && shipping.email &&
    shipping.address_line1 && shipping.city && shipping.state &&
    shipping.zip_code && shipping.country;

  const canProceedPayment = payment.card_number.length >= 13 &&
    payment.expiry.length >= 4 && payment.cvv.length >= 3;

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError('');
    try {
      const res = await orderService.placeOrder({
        shipping_address: {
          full_name: shipping.full_name,
          phone: shipping.phone,
          address_line1: shipping.address_line1,
          address_line2: shipping.address_line2,
          city: shipping.city,
          state: shipping.state,
          zip_code: shipping.zip_code,
          country: shipping.country,
        },
      });
      navigate(`/orders/${res.data.id}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0 && !placing) {
    return (
      <div className="checkout-page">
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <button onClick={() => navigate('/products')} className="cta-btn">Shop Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1 className="page-title">Checkout</h1>

      {/* Progress Bar */}
      <div className="progress-bar">
        {STEPS.map((s, i) => (
          <div key={s} className={`progress-step ${i <= step ? 'active' : ''} ${i < step ? 'completed' : ''}`}>
            <div className="step-circle">{i < step ? '✓' : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
        <div className="progress-line">
          <div className="progress-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="checkout-layout">
        <div className="checkout-form">
          {/* Step 1: Shipping */}
          {step === 0 && (
            <div className="checkout-step">
              <h2>Shipping Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input name="full_name" value={shipping.full_name} onChange={handleShippingChange} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input name="email" type="email" value={shipping.email} onChange={handleShippingChange} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={shipping.phone} onChange={handleShippingChange} />
                </div>
                <div className="form-group full">
                  <label>Address Line 1 *</label>
                  <input name="address_line1" value={shipping.address_line1} onChange={handleShippingChange} required />
                </div>
                <div className="form-group full">
                  <label>Address Line 2</label>
                  <input name="address_line2" value={shipping.address_line2} onChange={handleShippingChange} />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input name="city" value={shipping.city} onChange={handleShippingChange} required />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input name="state" value={shipping.state} onChange={handleShippingChange} required />
                </div>
                <div className="form-group">
                  <label>ZIP Code *</label>
                  <input name="zip_code" value={shipping.zip_code} onChange={handleShippingChange} required />
                </div>
                <div className="form-group">
                  <label>Country *</label>
                  <input name="country" value={shipping.country} onChange={handleShippingChange} required />
                </div>
              </div>
              <button className="step-btn" disabled={!canProceedShipping} onClick={() => setStep(1)}>
                Continue to Payment →
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 1 && (
            <div className="checkout-step">
              <h2>Payment Details</h2>
              <p className="payment-note">This is a demo — no real charges will be made.</p>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Card Number *</label>
                  <input
                    name="card_number"
                    placeholder="4242 4242 4242 4242"
                    maxLength="19"
                    value={payment.card_number}
                    onChange={handlePaymentChange}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry *</label>
                  <input
                    name="expiry"
                    placeholder="MM/YY"
                    maxLength="5"
                    value={payment.expiry}
                    onChange={handlePaymentChange}
                  />
                </div>
                <div className="form-group">
                  <label>CVV *</label>
                  <input
                    name="cvv"
                    placeholder="123"
                    maxLength="4"
                    type="password"
                    value={payment.cvv}
                    onChange={handlePaymentChange}
                  />
                </div>
              </div>
              <div className="step-btns">
                <button className="step-btn secondary" onClick={() => setStep(0)}>← Back</button>
                <button className="step-btn" disabled={!canProceedPayment} onClick={() => setStep(2)}>
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 2 && (
            <div className="checkout-step">
              <h2>Review Your Order</h2>

              <div className="review-section">
                <h3>Shipping To</h3>
                <p>{shipping.full_name}</p>
                <p>{shipping.address_line1} {shipping.address_line2}</p>
                <p>{shipping.city}, {shipping.state} {shipping.zip_code}</p>
                <p>{shipping.country}</p>
              </div>

              <div className="review-section">
                <h3>Items ({items.length})</h3>
                {items.map((item) => (
                  <div key={item.id} className="review-item">
                    <img src={item.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60&h=60&fit=crop'} alt={item.product_name} />
                    <div>
                      <span>{item.product_name}</span>
                      <span>Size: {item.size} × {item.quantity}</span>
                    </div>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="step-btns">
                <button className="step-btn secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="step-btn place-order" onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? (
                    <span className="spinner-btn">
                      <span className="spinner" /> Placing Order...
                    </span>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="summary-items-mini">
            {items.map((item) => (
              <div key={item.id} className="summary-mini-item">
                <span>{item.product_name} (×{item.quantity})</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>{shipping_fee === 0 ? 'Free' : `₹${shipping_fee.toFixed(2)}`}</span></div>
          <div className="summary-row"><span>Tax (8%)</span><span>₹{tax.toFixed(2)}</span></div>
          <div className="summary-row total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
