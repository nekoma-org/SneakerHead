# sneakerhead/product-service/app/api/v1/endpoints/products.py
import math
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductOut,
    ProductListResponse,
)
from app.crud.product import (
    get_products,
    get_product_by_id,
    get_featured_products,
    get_distinct_brands,
    search_products,
    create_product,
    update_product,
    delete_product,
    update_product_inventory,
)
from app.core.security import get_current_admin

logger = logging.getLogger("product-service")

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/featured", response_model=list[ProductOut])
async def list_featured(
    limit: int = Query(8, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    products = await get_featured_products(db, limit=limit)
    return products


@router.get("/brands", response_model=list[str])
async def list_brands(db: AsyncSession = Depends(get_db)):
    return await get_distinct_brands(db)


@router.get("/search", response_model=ProductListResponse)
async def search(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    products, total = await search_products(db, q, page, limit)
    total_pages = math.ceil(total / limit) if total > 0 else 1
    return ProductListResponse(
        products=products,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("", response_model=ProductListResponse)
async def list_products(
    brand: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    size: Optional[str] = Query(None),
    in_stock: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    products, total = await get_products(
        db,
        brand=brand,
        category=category,
        min_price=min_price,
        max_price=max_price,
        size=size,
        in_stock=in_stock,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )
    total_pages = math.ceil(total / limit) if total > 0 else 1
    return ProductListResponse(
        products=products,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    product = await get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    data: ProductCreate,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    product = await create_product(db, data)
    logger.info(f"Product created: {product.sku}")
    return product


@router.put("/{product_id}", response_model=ProductOut)
async def update_existing_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await get_product_by_id(db, product_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    updated = await update_product(db, product_id, data)
    logger.info(f"Product updated: {product_id}")
    return updated


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_product(
    product_id: uuid.UUID,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_product(db, product_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    logger.info(f"Product deleted: {product_id}")


@router.patch("/{product_id}/inventory")
async def patch_inventory(
    product_id: uuid.UUID,
    size: str = Query(...),
    quantity_change: int = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Internal endpoint used by order-service to decrement stock."""
    product = await update_product_inventory(db, product_id, size, quantity_change)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return {"status": "ok", "product_id": str(product_id), "size": size}
