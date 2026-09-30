from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import StorageReading, Lot, ProcurementCenter, User
from app.schemas.schemas import StorageReadingCreate, StorageReadingResponse
from app.services.storage_risk_engine import storage_risk_engine

router = APIRouter(prefix="/storage", tags=["Storage Quality & Deterioration Monitoring"])

@router.get("", response_model=List[StorageReadingResponse])
async def list_storage_readings(
    lot_id: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(StorageReading).order_by(desc(StorageReading.recorded_at))
    if lot_id:
        query = query.where(StorageReading.lot_id == lot_id)
    if risk_level:
        query = query.where(StorageReading.deterioration_risk_level == risk_level)
        
    res = await db.execute(query)
    readings = res.scalars().all()
    
    return [
        StorageReadingResponse(
            id=s.id,
            lot_id=s.lot_id,
            center_id=s.center_id,
            warehouse_bay=s.warehouse_bay,
            temperature_c=s.temperature_c,
            relative_humidity_pct=s.relative_humidity_pct,
            rot_incidence_pct=s.rot_incidence_pct,
            sprouting_incidence_pct=s.sprouting_incidence_pct,
            weight_loss_pct=s.weight_loss_pct,
            deterioration_risk_level=s.deterioration_risk_level,
            risk_factors=s.risk_factors_json or {},
            recorded_by_id=s.recorded_by_id,
            recorded_at=s.recorded_at
        )
        for s in readings
    ]

@router.post("", response_model=StorageReadingResponse)
async def add_storage_reading(
    payload: StorageReadingCreate,
    operator_id: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    lot = await db.get(Lot, payload.lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
        
    # Calculate storage days
    days_in_storage = (datetime.now(timezone.utc) - (lot.arrival_date or datetime.now(timezone.utc))).days
    days_in_storage = max(1, days_in_storage)
    
    # Calculate deterioration risk
    risk = storage_risk_engine.calculate_deterioration_risk(
        temperature_c=payload.temperature_c,
        relative_humidity_pct=payload.relative_humidity_pct,
        storage_days=days_in_storage,
        rot_incidence_pct=payload.rot_incidence_pct,
        sprouting_incidence_pct=payload.sprouting_incidence_pct,
        weight_loss_pct=payload.weight_loss_pct,
        initial_grade=lot.current_grade or "GRADE_A"
    )
    
    now = datetime.now(timezone.utc)
    reading = StorageReading(
        lot_id=payload.lot_id,
        center_id=lot.center_id,
        warehouse_bay=payload.warehouse_bay,
        temperature_c=payload.temperature_c,
        relative_humidity_pct=payload.relative_humidity_pct,
        rot_incidence_pct=payload.rot_incidence_pct,
        sprouting_incidence_pct=payload.sprouting_incidence_pct,
        weight_loss_pct=payload.weight_loss_pct,
        deterioration_risk_level=risk["risk_level"],
        risk_factors_json=risk,
        recorded_by_id=operator_id,
        recorded_at=now
    )
    db.add(reading)
    
    # Update lot status to IN_STORAGE if not already
    if lot.status != "IN_STORAGE":
        lot.status = "IN_STORAGE"
        
    await db.commit()
    await db.refresh(reading)
    
    return StorageReadingResponse(
        id=reading.id,
        lot_id=reading.lot_id,
        center_id=reading.center_id,
        warehouse_bay=reading.warehouse_bay,
        temperature_c=reading.temperature_c,
        relative_humidity_pct=reading.relative_humidity_pct,
        rot_incidence_pct=reading.rot_incidence_pct,
        sprouting_incidence_pct=reading.sprouting_incidence_pct,
        weight_loss_pct=reading.weight_loss_pct,
        deterioration_risk_level=reading.deterioration_risk_level,
        risk_factors=reading.risk_factors_json or {},
        recorded_by_id=reading.recorded_by_id,
        recorded_at=reading.recorded_at
    )
