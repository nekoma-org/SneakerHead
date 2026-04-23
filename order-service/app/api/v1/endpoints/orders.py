# sneakerhead/order-service/app/api/v1/endpoints/orders.py
import uuid
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from app.crud.cart import get_cart, calculate_cart_totals, clear_cart
from app.crud.order import (
    create_order,
    get_orders_by_user,
    get_order_by_id,
    get_order_by_id_admin,
    update_order_status,
)
from app.core.security import get_current_user_id, get_current_admin_id
from app.core.config import settings

logger = logging.getLogger("order-service")

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def place_order(
    data: OrderCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # 1. Get user cart, validate not empty
    cart = await get_cart(db, user_id)
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    # 2. Verify each item with product-service
    async with httpx.AsyncClient(timeout=10.0) as client:
        for item in cart.items:
            try:
                resp = await client.get(
                    f"{settings.product_service_url}/api/v1/products/{item.product_id}"
                )
                if resp.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product {item.product_name} not found or unavailable",
                    )
                product_data = resp.json()
                sizes_inv = product_data.get("sizes_inventory", {})
                available = sizes_inv.get(item.size, 0)
                if available < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"{item.product_name} size {item.size} is out of stock (available: {available}, requested: {item.quantity})",
                    )
            except httpx.RequestError as e:
                logger.error(f"Failed to verify product {item.product_id}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Product service unavailable, please try again",
                )

    # 3. Calculate totals
    totals = calculate_cart_totals(cart)

    # 4. Create order
    order = await create_order(
        db=db,
        user_id=user_id,
        cart=cart,
        shipping_address=data.shipping_address.model_dump(),
        subtotal=totals["subtotal"],
        shipping_fee=totals["shipping_fee"],
        tax=totals["tax"],
        total=totals["total"],
    )

    # 5. Decrement stock in product-service
    async with httpx.AsyncClient(timeout=10.0) as client:
        for item in cart.items:
            try:
                await client.patch(
                    f"{settings.product_service_url}/api/v1/products/{item.product_id}/inventory",
                    params={"size": item.size, "quantity_change": -item.quantity},
                )
            except httpx.RequestError as e:
                logger.error(
                    f"Failed to decrement stock for {item.product_id}: {e}"
                )

    # 6. Clear cart
    await clear_cart(db, user_id)

    logger.info(f"Order {order.id} placed by user {user_id}")
    return order


@router.get("", response_model=list[OrderOut])
async def order_history(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await get_orders_by_user(db, user_id)


@router.get("/{order_id}", response_model=OrderOut)
async def get_order_detail(
    order_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    order = await get_order_by_id(db, order_id, user_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
async def change_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    admin_id: uuid.UUID = Depends(get_current_admin_id),
    db: AsyncSession = Depends(get_db),
):
    order = await get_order_by_id_admin(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    updated = await update_order_status(db, order_id, data.status)
    logger.info(f"Order {order_id} status changed to {data.status} by admin {admin_id}")
    return updated
