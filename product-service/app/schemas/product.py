# sneakerhead/product-service/app/schemas/product.py
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    brand: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    colorway: Optional[str] = Field(None, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    compare_at_price: Optional[float] = Field(None, gt=0)
    images: List[str] = []
    sizes_inventory: Dict[str, int] = {}
    is_featured: bool = False
    is_active: bool = True
    rating: float = 0
    review_count: int = 0


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    brand: Optional[str] = Field(None, min_length=1, max_length=255)
    colorway: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    compare_at_price: Optional[float] = Field(None, gt=0)
    images: Optional[List[str]] = None
    sizes_inventory: Optional[Dict[str, int]] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None


class ProductOut(BaseModel):
    id: uuid.UUID
    name: str
    brand: str
    sku: str
    colorway: Optional[str]
    category: str
    description: Optional[str]
    price: float
    compare_at_price: Optional[float]
    images: List[str]
    sizes_inventory: Dict[str, int]
    is_featured: bool
    is_active: bool
    rating: float
    review_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    products: List[ProductOut]
    total: int
    page: int
    limit: int
    total_pages: int
