// sneakerhead/frontend-service/src/components/ProductCard.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const totalStock = product.sizes_inventory
    ? Object.values(product.sizes_inventory).reduce((a, b) => a + b, 0)
    : 0;

  const isLowStock = totalStock > 0 && totalStock < 5;
  const isOutOfStock = totalStock === 0;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedSize) return;
    try {
      await addToCart({
        product_id: product.id,
        product_name: product.name,
        product_image: product.images?.[0] || '',
        size: selectedSize,
        price: product.price,
        quantity: 1,
      });
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const availableSizes = product.sizes_inventory
    ? Object.entries(product.sizes_inventory)
        .filter(([, qty]) => qty > 0)
        .map(([size]) => size)
    : [];

  return (
    <div
      className={`product-card ${hovered ? 'hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-card-image">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop'}
            alt={product.name}
            loading="lazy"
          />
          {isLowStock && <span className="badge-low-stock">Low Stock</span>}
          {isOutOfStock && <span className="badge-out-stock">Sold Out</span>}
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="badge-sale">Sale</span>
          )}

          {hovered && availableSizes.length > 0 && (
            <div className="quick-add-overlay">
              <div className="quick-sizes">
                {availableSizes.slice(0, 7).map((size) => (
                  <button
                    key={size}
                    className={`quick-size-btn ${selectedSize === size ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(size);
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button
                className="quick-add-btn"
                onClick={handleQuickAdd}
                disabled={!selectedSize}
              >
                {selectedSize ? 'Add to Cart' : 'Select Size'}
              </button>
            </div>
          )}
        </div>

        <div className="product-card-info">
          <span className="product-brand">{product.brand}</span>
          <h3 className="product-name">{product.name}</h3>
          {product.colorway && (
            <span className="product-colorway">{product.colorway}</span>
          )}
          <div className="product-price-row">
            <span className="product-price">₹{product.price.toFixed(2)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="product-compare-price">
                ₹{product.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>
          <div className="product-rating">
            {'★'.repeat(Math.round(product.rating || 0))}
            {'☆'.repeat(5 - Math.round(product.rating || 0))}
            <span className="review-count">({product.review_count})</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

