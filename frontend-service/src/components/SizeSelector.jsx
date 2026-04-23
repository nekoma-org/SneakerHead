// sneakerhead/frontend-service/src/components/SizeSelector.jsx
import React from 'react';

export default function SizeSelector({
  sizesInventory = {},
  selectedSize,
  onSizeChange,
}) {
  const sizes = Object.entries(sizesInventory);

  return (
    <div className="size-selector">
      <h4 className="size-label">
        Select Size {selectedSize && <span className="selected-size">— US {selectedSize}</span>}
      </h4>
      <div className="size-grid">
        {sizes.map(([size, stock]) => {
          const isOutOfStock = stock === 0;
          const isSelected = selectedSize === size;
          return (
            <button
              key={size}
              className={`size-btn ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
              onClick={() => !isOutOfStock && onSizeChange(size)}
              disabled={isOutOfStock}
              title={isOutOfStock ? 'Out of stock' : `${stock} in stock`}
            >
              US {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
