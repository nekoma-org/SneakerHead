# sneakerhead/order-service/app/api/v1/endpoints/cart.py
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartOut
from app.crud.cart import (
    get_or_create_cart,
    get_cart,
    add_item_to_cart,
    update_cart_item,
    remove_cart_item,
    clear_cart,
    calculate_cart_totals,
)
from app.core.security import get_current_user_id

logger = logging.getLogger("order-service")

router = APIRouter(prefix="/cart", tags=["cart"])


def _cart_response(cart) -> dict:
    totals = calculate_cart_totals(cart)
    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": cart.items,
        "subtotal": totals["subtotal"],
        "shipping_fee": totals["shipping_fee"],
        "tax": totals["tax"],
        "total": totals["total"],
        "created_at": cart.created_at,
        "updated_at": cart.updated_at,
    }


@router.post("", response_model=CartOut)
async def add_to_cart(
    data: CartItemAdd,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    cart = await add_item_to_cart(db, user_id, data)
    logger.info(f"Item added to cart for user {user_id}")
    return _cart_response(cart)


@router.get("", response_model=CartOut)
async def get_user_cart(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    cart = await get_or_create_cart(db, user_id)
    return _cart_response(cart)


@router.patch("/{item_id}", response_model=CartOut)
async def update_item_quantity(
    item_id: uuid.UUID,
    data: CartItemUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    cart = await update_cart_item(db, user_id, item_id, data)
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart or item not found",
        )
    logger.info(f"Cart item {item_id} updated for user {user_id}")
    return _cart_response(cart)


@router.delete("/{item_id}", response_model=CartOut)
async def remove_item(
    item_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    cart = await remove_cart_item(db, user_id, item_id)
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart or item not found",
        )
    logger.info(f"Cart item {item_id} removed for user {user_id}")
    return _cart_response(cart)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_user_cart(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await clear_cart(db, user_id)
    logger.info(f"Cart cleared for user {user_id}")
