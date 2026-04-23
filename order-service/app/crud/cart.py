# sneakerhead/order-service/app/crud/cart.py
import uuid
from decimal import Decimal
from typing import Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import Cart, CartItem
from app.schemas.cart import CartItemAdd, CartItemUpdate


async def get_or_create_cart(db: AsyncSession, user_id: uuid.UUID) -> Cart:
    result = await db.execute(
        select(Cart)
        .where(Cart.user_id == user_id)
        .options(selectinload(Cart.items))
    )
    cart = result.scalars().first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart, attribute_names=["items"])
    return cart


async def get_cart(db: AsyncSession, user_id: uuid.UUID) -> Optional[Cart]:
    result = await db.execute(
        select(Cart)
        .where(Cart.user_id == user_id)
        .options(selectinload(Cart.items))
    )
    return result.scalars().first()


async def add_item_to_cart(
    db: AsyncSession, user_id: uuid.UUID, data: CartItemAdd
) -> Cart:
    cart = await get_or_create_cart(db, user_id)

    # Check if same product + size already in cart
    existing_item = None
    for item in cart.items:
        if item.product_id == data.product_id and item.size == data.size:
            existing_item = item
            break

    if existing_item:
        existing_item.quantity += data.quantity
        await db.commit()
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=data.product_id,
            product_name=data.product_name,
            product_image=data.product_image,
            size=data.size,
            price=data.price,
            quantity=data.quantity,
        )
        db.add(new_item)
        await db.commit()

    await db.refresh(cart, attribute_names=["items"])
    return cart


async def update_cart_item(
    db: AsyncSession,
    user_id: uuid.UUID,
    item_id: uuid.UUID,
    data: CartItemUpdate,
) -> Optional[Cart]:
    cart = await get_cart(db, user_id)
    if not cart:
        return None

    await db.execute(
        update(CartItem)
        .where(CartItem.id == item_id, CartItem.cart_id == cart.id)
        .values(quantity=data.quantity)
    )
    await db.commit()
    await db.refresh(cart, attribute_names=["items"])
    return cart


async def remove_cart_item(
    db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID
) -> Optional[Cart]:
    cart = await get_cart(db, user_id)
    if not cart:
        return None

    await db.execute(
        delete(CartItem).where(
            CartItem.id == item_id, CartItem.cart_id == cart.id
        )
    )
    await db.commit()
    await db.refresh(cart, attribute_names=["items"])
    return cart


async def clear_cart(db: AsyncSession, user_id: uuid.UUID) -> bool:
    cart = await get_cart(db, user_id)
    if not cart:
        return False

    await db.execute(
        delete(CartItem).where(CartItem.cart_id == cart.id)
    )
    await db.commit()
    return True


def calculate_cart_totals(cart: Cart) -> dict:
    subtotal = sum(
        Decimal(str(item.price)) * item.quantity for item in cart.items
    )
    shipping_fee = Decimal("0.00") if subtotal >= Decimal("150.00") else Decimal("9.99")
    tax = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
    total = subtotal + shipping_fee + tax
    return {
        "subtotal": float(subtotal),
        "shipping_fee": float(shipping_fee),
        "tax": float(tax),
        "total": float(total),
    }
