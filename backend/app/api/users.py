from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import User, ProcurementCenter
from app.schemas.schemas import UserResponse, UserCreate, ProcurementCenterResponse
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users & Centers"])

@router.get("", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User))
    users = res.scalars().all()
    return [UserResponse.model_validate(u) for u in users]

@router.post("", response_model=UserResponse)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        center_id=payload.center_id,
        is_active=payload.is_active
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)

@router.get("/centers", response_model=List[ProcurementCenterResponse])
async def list_centers(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ProcurementCenter))
    centers = res.scalars().all()
    return [ProcurementCenterResponse.model_validate(c) for c in centers]
