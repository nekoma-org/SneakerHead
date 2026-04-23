# sneakerhead/product-service/app/crud/product.py
import math
import uuid
from typing import Optional, List, Tuple

from sqlalchemy import select, update, delete, func, or_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


async def get_product_by_id(
    db: AsyncSession, product_id: uuid.UUID
) -> Optional[Product]:
    result = await db.execute(select(Product).where(Product.id == product_id))
    return result.scalars().first()


async def get_product_by_sku(db: AsyncSession, sku: str) -> Optional[Product]:
    result = await db.execute(select(Product).where(Product.sku == sku))
    return result.scalars().first()


async def get_products(
    db: AsyncSession,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    size: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sort_by: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
) -> Tuple[List[Product], int]:
    query = select(Product).where(Product.is_active == True)
    count_query = select(func.count(Product.id)).where(Product.is_active == True)

    if brand:
        brands = [b.strip() for b in brand.split(",")]
        query = query.where(Product.brand.in_(brands))
        count_query = count_query.where(Product.brand.in_(brands))

    if category:
        query = query.where(Product.category == category)
        count_query = count_query.where(Product.category == category)

    if min_price is not None:
        query = query.where(Product.price >= min_price)
        count_query = count_query.where(Product.price >= min_price)

    if max_price is not None:
        query = query.where(Product.price <= max_price)
        count_query = count_query.where(Product.price <= max_price)

    # Sort
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    elif sort_by == "popular":
        query = query.order_by(Product.review_count.desc())
    else:
        query = query.order_by(Product.is_featured.desc(), Product.created_at.desc())

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    products = list(result.scalars().all())

    return products, total


async def get_featured_products(
    db: AsyncSession, limit: int = 8
) -> List[Product]:
    result = await db.execute(
        select(Product)
        .where(Product.is_featured == True, Product.is_active == True)
        .order_by(Product.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_distinct_brands(db: AsyncSession) -> List[str]:
    result = await db.execute(
        select(Product.brand)
        .where(Product.is_active == True)
        .distinct()
        .order_by(Product.brand)
    )
    return [row[0] for row in result.all()]


async def search_products(
    db: AsyncSession, query_term: str, page: int = 1, limit: int = 10
) -> Tuple[List[Product], int]:
    search = f"%{query_term}%"
    condition = or_(
        Product.name.ilike(search),
        Product.brand.ilike(search),
        Product.description.ilike(search),
        Product.colorway.ilike(search),
        Product.category.ilike(search),
    )
    base = select(Product).where(Product.is_active == True, condition)
    count_q = select(func.count(Product.id)).where(Product.is_active == True, condition)

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    result = await db.execute(base.offset(offset).limit(limit))
    products = list(result.scalars().all())

    return products, total


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def update_product(
    db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate
) -> Optional[Product]:
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return await get_product_by_id(db, product_id)
    await db.execute(
        update(Product).where(Product.id == product_id).values(**update_data)
    )
    await db.commit()
    return await get_product_by_id(db, product_id)


async def delete_product(db: AsyncSession, product_id: uuid.UUID) -> bool:
    result = await db.execute(
        delete(Product).where(Product.id == product_id)
    )
    await db.commit()
    return result.rowcount > 0


async def update_product_inventory(
    db: AsyncSession, product_id: uuid.UUID, size: str, quantity_change: int
) -> Optional[Product]:
    product = await get_product_by_id(db, product_id)
    if not product:
        return None
    sizes_inv = dict(product.sizes_inventory) if product.sizes_inventory else {}
    current = sizes_inv.get(size, 0)
    new_qty = max(0, current + quantity_change)
    sizes_inv[size] = new_qty
    await db.execute(
        update(Product)
        .where(Product.id == product_id)
        .values(sizes_inventory=sizes_inv)
    )
    await db.commit()
    return await get_product_by_id(db, product_id)


async def get_product_count(db: AsyncSession) -> int:
    result = await db.execute(select(func.count(Product.id)))
    return result.scalar() or 0
