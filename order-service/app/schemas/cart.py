# sneakerhead/order-service/app/schemas/cart.py
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    product_id: uuid.UUID
    product_name: str = Field(..., min_length=1, max_length=500)
    product_image: Optional[str] = None
    size: str = Field(..., min_length=1, max_length=10)
    price: float = Field(..., gt=0)
    quantity: int = Field(1, ge=1, le=20)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, le=20)


class CartItemOut(BaseModel):
    id: uuid.UUID
    cart_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_image: Optional[str]
    size: str
    price: float
    quantity: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    items: List[CartItemOut]
    subtotal: float
    shipping_fee: float
    tax: float
    total: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
