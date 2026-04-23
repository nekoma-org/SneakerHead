// sneakerhead/frontend-service/src/components/FilterSidebar.jsx
import React from 'react';

const CATEGORIES = ['Running', 'Basketball', 'Lifestyle', 'Skate', 'Training'];
const SIZES = ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

export default function FilterSidebar({
  brands = [],
  filters,
  onFilterChange,
  onClearFilters,
}) {
  const handleBrandToggle = (brand) => {
    const current = filters.brands || [];
    const updated = current.includes(brand)
      ? current.filter((b) => b !== brand)
      : [...current, brand];
    onFilterChange({ ...filters, brands: updated });
  };

  const handleSizeToggle = (size) => {
    const current = filters.sizes || [];
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onFilterChange({ ...filters, sizes: updated });
  };

  const handleCategoryChange = (category) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? '' : category,
    });
  };

  const handlePriceChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleInStockToggle = () => {
    onFilterChange({ ...filters, inStock: !filters.inStock });
  };

  const activeFilterCount =
    (filters.brands?.length || 0) +
    (filters.sizes?.length || 0) +
    (filters.category ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <h3>Filters</h3>
        {activeFilterCount > 0 && (
          <button className="clear-filters-btn" onClick={onClearFilters}>
            Clear All ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="filter-section">
        <h4>Brand</h4>
        <div className="filter-checkboxes">
          {brands.map((brand) => (
            <label key={brand} className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.brands?.includes(brand) || false}
                onChange={() => handleBrandToggle(brand)}
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Size (US)</h4>
        <div className="size-toggles">
          {SIZES.map((size) => (
            <button
              key={size}
              className={`size-toggle ${filters.sizes?.includes(size) ? 'active' : ''}`}
              onClick={() => handleSizeToggle(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Price Range</h4>
        <div className="price-range">
          <input
            type="number"
            placeholder="₹0"
            min="0"
            max="30000"
            value={filters.minPrice || ''}
            onChange={(e) => handlePriceChange('minPrice', e.target.value)}
          />
          <span>—</span>
          <input
            type="number"
            placeholder="₹30,000"
            min="0"
            max="30000"
            value={filters.maxPrice || ''}
            onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
          />
        </div>
        <input
          type="range"
          min="0"
          max="30000"
          step="500"
          value={filters.maxPrice || 30000}
          onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
          className="price-slider"
        />
      </div>

      <div className="filter-section">
        <h4>Category</h4>
        <div className="category-btns">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${filters.category === cat ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-checkbox in-stock-toggle">
          <input
            type="checkbox"
            checked={filters.inStock || false}
            onChange={handleInStockToggle}
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </aside>
  );
}
