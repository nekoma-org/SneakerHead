# sneakerhead/order-service/app/crud/order.py
import uuid
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem
from app.models.cart import Cart


async def create_order(
    db: AsyncSession,
    user_id: uuid.UUID,
    cart: Cart,
    shipping_address: dict,
    subtotal: float,
    shipping_fee: float,
    tax: float,
    total: float,
) -> Order:
    order = Order(
        user_id=user_id,
        shipping_address=shipping_address,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        tax=tax,
        total=total,
        status="pending",
    )
    db.add(order)
    await db.flush()

    for item in cart.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            product_image=item.product_image,
            size=item.size,
            price=item.price,
            quantity=item.quantity,
        )
        db.add(order_item)

    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return order


async def get_orders_by_user(db: AsyncSession, user_id: uuid.UUID) -> List[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user_id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def get_order_by_id(
    db: AsyncSession, order_id: uuid.UUID, user_id: uuid.UUID
) -> Optional[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.user_id == user_id)
        .options(selectinload(Order.items))
    )
    return result.scalars().first()


async def get_order_by_id_admin(
    db: AsyncSession, order_id: uuid.UUID
) -> Optional[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    return result.scalars().first()


async def update_order_status(
    db: AsyncSession, order_id: uuid.UUID, new_status: str
) -> Optional[Order]:
    await db.execute(
        update(Order).where(Order.id == order_id).values(status=new_status)
    )
    await db.commit()
    return await get_order_by_id_admin(db, order_id)
