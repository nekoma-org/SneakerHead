# sneakerhead/order-service/app/schemas/order.py
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ShippingAddress(BaseModel):
    full_name: str
    phone: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    country: str


class OrderCreate(BaseModel):
    shipping_address: ShippingAddress


class OrderItemOut(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_image: Optional[str]
    size: str
    price: float
    quantity: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    shipping_address: Optional[Dict[str, Any]]
    subtotal: float
    shipping_fee: float
    tax: float
    total: float
    items: List[OrderItemOut]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        pattern="^(pending|confirmed|processing|shipped|delivered|cancelled)$",
    )
