// sneakerhead/frontend-service/src/pages/ProductDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import SizeSelector from '../components/SizeSelector';
import ProductCard from '../components/ProductCard';

const ACCORDION_ITEMS = [
  { key: 'description', title: 'Description' },
  { key: 'materials', title: 'Materials & Construction' },
  { key: 'care', title: 'Care Instructions' },
  { key: 'shipping', title: 'Shipping & Returns' },
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [openAccordion, setOpenAccordion] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await productService.getProduct(id);
        setProduct(res.data);
        setSelectedImage(0);
        setSelectedSize('');
        setQuantity(1);
        setAddedToCart(false);

        // Load related products
        const relatedRes = await productService.getProducts({
          brand: res.data.brand,
          limit: 4,
        });
        setRelated(
          (relatedRes.data.products || []).filter((p) => p.id !== id).slice(0, 4)
        );
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
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
        quantity,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error('Add to cart failed:', err);
    }
  };

  const accordionContent = {
    description: product?.description || 'No description available.',
    materials: 'Premium leather and synthetic upper. Rubber outsole for durability and traction. EVA midsole for lightweight cushioning. Breathable textile lining.',
    care: 'Spot clean with a soft cloth and mild soap. Air dry away from direct heat. Store in a cool, dry place. Use shoe trees to maintain shape.',
    shipping: 'Free standard shipping on orders over $150. Standard delivery: 5-7 business days. Express delivery: 2-3 business days ($14.99). Free returns within 30 days of delivery.',
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="not-found">
          <h2>Product Not Found</h2>
          <Link to="/products">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Shop</Link>
        <span>/</span>
        <Link to={`/products?brand=${product.brand}`}>{product.brand}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-detail-main">
        {/* Image Gallery */}
        <div className="product-gallery">
          <div className="main-image">
            <img
              src={product.images?.[selectedImage] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop'}
              alt={product.name}
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-strip">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`thumbnail ${selectedImage === i ? 'active' : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  <img src={img} alt={`${product.name} view ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <span className="product-detail-brand">{product.brand}</span>
          <h1 className="product-detail-name">{product.name}</h1>
          {product.colorway && (
            <span className="product-detail-colorway">{product.colorway}</span>
          )}
          <span className="product-sku">SKU: {product.sku}</span>

          <div className="product-rating-detail">
            {'★'.repeat(Math.round(product.rating || 0))}
            {'☆'.repeat(5 - Math.round(product.rating || 0))}
            <span>{product.rating?.toFixed(1)}</span>
            <span>({product.review_count} reviews)</span>
          </div>

          <div className="product-detail-price">
            <span className="current-price">₹{product.price.toFixed(2)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <>
                <span className="compare-price">₹{product.compare_at_price.toFixed(2)}</span>
                <span className="save-badge">
                  Save ₹{(product.compare_at_price - product.price).toFixed(2)}
                </span>
              </>
            )}
          </div>

          <SizeSelector
            sizesInventory={product.sizes_inventory || {}}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
          />

          <div className="quantity-selector">
            <label>Quantity</label>
            <div className="qty-controls">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              />
              <button onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
            </div>
          </div>

          <button
            className={`add-to-cart-btn ${addedToCart ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={!selectedSize || cartLoading}
          >
            {addedToCart ? '✓ Added to Cart' : cartLoading ? 'Adding...' : 'Add to Cart'}
          </button>

          {/* Accordion */}
          <div className="product-accordion">
            {ACCORDION_ITEMS.map(({ key, title }) => (
              <div key={key} className={`accordion-item ${openAccordion === key ? 'open' : ''}`}>
                <button
                  className="accordion-header"
                  onClick={() => setOpenAccordion(openAccordion === key ? '' : key)}
                >
                  <span>{title}</span>
                  <span className="accordion-icon">{openAccordion === key ? '−' : '+'}</span>
                </button>
                {openAccordion === key && (
                  <div className="accordion-content">
                    <p>{accordionContent[key]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="section related-section">
          <h2 className="section-title">You May Also <span className="accent">Like</span></h2>
          <div className="product-grid-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
