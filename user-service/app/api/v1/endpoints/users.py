# sneakerhead/user-service/app/api/v1/endpoints/users.py
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    UserOut,
    UserUpdate,
    AddressCreate,
    AddressUpdate,
    AddressOut,
)
from app.crud.user import (
    update_user,
    get_addresses,
    get_address_by_id,
    create_address,
    update_address,
    delete_address,
)
from app.core.security import get_current_user

logger = logging.getLogger("user-service")

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await update_user(db, current_user.id, data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    logger.info(f"Profile updated: {current_user.email}")
    return updated


# ── Address Endpoints ────────────────────────────────
@router.get("/me/addresses", response_model=list[AddressOut])
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_addresses(db, current_user.id)


@router.post(
    "/me/addresses",
    response_model=AddressOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_address(
    data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    address = await create_address(db, current_user.id, data)
    logger.info(f"Address created for user {current_user.id}")
    return address


@router.put("/me/addresses/{address_id}", response_model=AddressOut)
async def edit_address(
    address_id: uuid.UUID,
    data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await get_address_by_id(db, address_id, current_user.id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Address not found"
        )
    updated = await update_address(db, address_id, current_user.id, data)
    logger.info(f"Address {address_id} updated for user {current_user.id}")
    return updated


@router.delete(
    "/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_address(
    address_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_address(db, address_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Address not found"
        )
    logger.info(f"Address {address_id} deleted for user {current_user.id}")
