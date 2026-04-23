# sneakerhead/user-service/app/crud/user.py
import uuid
from typing import Optional, List

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, Address
from app.schemas.user import (
    UserRegister,
    UserUpdate,
    AddressCreate,
    AddressUpdate,
)
from app.core.security import hash_password


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def create_user(db: AsyncSession, data: UserRegister) -> User:
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(
    db: AsyncSession, user_id: uuid.UUID, data: UserUpdate
) -> Optional[User]:
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    if not update_data:
        return await get_user_by_id(db, user_id)
    await db.execute(
        update(User).where(User.id == user_id).values(**update_data)
    )
    await db.commit()
    return await get_user_by_id(db, user_id)


# ── Address CRUD ─────────────────────────────────────
async def get_addresses(db: AsyncSession, user_id: uuid.UUID) -> List[Address]:
    result = await db.execute(
        select(Address).where(Address.user_id == user_id).order_by(Address.created_at)
    )
    return list(result.scalars().all())


async def get_address_by_id(
    db: AsyncSession, address_id: uuid.UUID, user_id: uuid.UUID
) -> Optional[Address]:
    result = await db.execute(
        select(Address).where(
            Address.id == address_id, Address.user_id == user_id
        )
    )
    return result.scalars().first()


async def create_address(
    db: AsyncSession, user_id: uuid.UUID, data: AddressCreate
) -> Address:
    if data.is_default:
        await db.execute(
            update(Address)
            .where(Address.user_id == user_id)
            .values(is_default=False)
        )
    address = Address(user_id=user_id, **data.model_dump())
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


async def update_address(
    db: AsyncSession,
    address_id: uuid.UUID,
    user_id: uuid.UUID,
    data: AddressUpdate,
) -> Optional[Address]:
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return await get_address_by_id(db, address_id, user_id)
    if update_data.get("is_default"):
        await db.execute(
            update(Address)
            .where(Address.user_id == user_id)
            .values(is_default=False)
        )
    await db.execute(
        update(Address)
        .where(Address.id == address_id, Address.user_id == user_id)
        .values(**update_data)
    )
    await db.commit()
    return await get_address_by_id(db, address_id, user_id)


async def delete_address(
    db: AsyncSession, address_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    result = await db.execute(
        delete(Address).where(
            Address.id == address_id, Address.user_id == user_id
        )
    )
    await db.commit()
    return result.rowcount > 0
