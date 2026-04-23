// sneakerhead/frontend-service/src/pages/ProductList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';

const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
];

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sort_by') || '';
  const searchQ = searchParams.get('q') || '';

  const [filters, setFilters] = useState({
    brands: searchParams.get('brand') ? searchParams.get('brand').split(',') : [],
    sizes: searchParams.get('size') ? searchParams.get('size').split(',') : [],
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    inStock: searchParams.get('in_stock') === 'true',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (sortBy) params.sort_by = sortBy;
      if (filters.brands.length) params.brand = filters.brands.join(',');
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.sizes.length) params.size = filters.sizes.join(',');
      if (filters.inStock) params.in_stock = true;

      let res;
      if (searchQ) {
        res = await productService.searchProducts(searchQ, page, 10);
      } else {
        res = await productService.getProducts(params);
      }
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, filters, searchQ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await productService.getBrands();
        setBrands(res.data || []);
      } catch { }
    };
    loadBrands();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.brands.length) params.set('brand', newFilters.brands.join(','));
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.minPrice) params.set('min_price', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('max_price', newFilters.maxPrice);
    if (newFilters.sizes.length) params.set('size', newFilters.sizes.join(','));
    if (newFilters.inStock) params.set('in_stock', 'true');
    if (sortBy) params.set('sort_by', sortBy);
    if (searchQ) params.set('q', searchQ);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSortChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('sort_by', value);
    else params.delete('sort_by');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({ brands: [], sizes: [], category: '', minPrice: '', maxPrice: '', inStock: false });
    setSearchParams({});
  };

  const activeChips = [];
  if (filters.brands.length) filters.brands.forEach(b => activeChips.push({ label: b, type: 'brand', value: b }));
  if (filters.category) activeChips.push({ label: filters.category, type: 'category', value: filters.category });
  if (filters.sizes.length) filters.sizes.forEach(s => activeChips.push({ label: `US ${s}`, type: 'size', value: s }));
  if (filters.minPrice) activeChips.push({ label: `Min ₹${filters.minPrice}`, type: 'minPrice' });
  if (filters.maxPrice) activeChips.push({ label: `Max ₹${filters.maxPrice}`, type: 'maxPrice' });
  if (filters.inStock) activeChips.push({ label: 'In Stock', type: 'inStock' });

  const removeChip = (chip) => {
    const newFilters = { ...filters };
    if (chip.type === 'brand') newFilters.brands = newFilters.brands.filter(b => b !== chip.value);
    else if (chip.type === 'category') newFilters.category = '';
    else if (chip.type === 'size') newFilters.sizes = newFilters.sizes.filter(s => s !== chip.value);
    else if (chip.type === 'minPrice') newFilters.minPrice = '';
    else if (chip.type === 'maxPrice') newFilters.maxPrice = '';
    else if (chip.type === 'inStock') newFilters.inStock = false;
    handleFilterChange(newFilters);
  };

  return (
    <div className="product-list-page">
      <FilterSidebar
        brands={brands}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      <div className="product-list-content">
        <div className="product-list-header">
          <div className="header-left">
            <h1>{searchQ ? `Results for "${searchQ}"` : 'All Sneakers'}</h1>
            <span className="product-count">{total} products</span>
          </div>
          <div className="header-right">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="sort-select"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                ⊞
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                ≡
              </button>
            </div>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="active-filters">
            {activeChips.map((chip, i) => (
              <span key={i} className="filter-chip">
                {chip.label}
                <button onClick={() => removeChip(chip)}>✕</button>
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <div className="product-grid loading">
            {Array(6).fill(0).map((_, i) => <div key={i} className="product-skeleton" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <h3>No sneakers found</h3>
            <p>Try adjusting your filters or search term</p>
            <button onClick={clearFilters} className="clear-btn">Clear All Filters</button>
          </div>
        ) : (
          <div className={`product-grid ${viewMode}`}>
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => handlePageChange(page - 1)}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - page) < 3 || p === 1 || p === totalPages)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="pagination-dots">…</span>}
                  <button
                    className={page === p ? 'active' : ''}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
