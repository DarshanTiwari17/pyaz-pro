from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import QualityPassport, Lot, Supplier, ProcurementCenter, Inspection, StorageReading, InspectionImage, OnionDetection
from app.schemas.schemas import QualityPassportResponse

router = APIRouter(prefix="/quality-passports", tags=["Digital Quality Passport"])

@router.get("/{lot_id}", response_model=QualityPassportResponse)
async def get_lot_quality_passport(lot_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Lot)
        .options(
            selectinload(Lot.supplier),
            selectinload(Lot.center),
            selectinload(Lot.passport),
            selectinload(Lot.inspections).selectinload(Inspection.images).selectinload(InspectionImage.detections),
            selectinload(Lot.storage_readings)
        )
        .where(Lot.id == lot_id)
    )
    lot = result.scalars().first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
        
    passport = lot.passport
    if not passport:
        raise HTTPException(status_code=404, detail="Quality Passport has not been generated for this lot yet. Complete and finalize inspection first.")

    # Build timeline
    timeline = []
    for insp in sorted(lot.inspections, key=lambda x: x.created_at):
        timeline.append({
            "stage": "INSPECTION",
            "number": insp.inspection_number,
            "status": insp.status,
            "grade": insp.grade_result,
            "grade_a_pct": insp.grade_a_percentage,
            "urs_pct": insp.urs_percentage,
            "timestamp": insp.created_at.isoformat(),
            "notes": insp.notes
        })
        
    storage_hist = []
    for s in sorted(lot.storage_readings, key=lambda x: x.recorded_at, reverse=True):
        storage_hist.append({
            "bay": s.warehouse_bay,
            "temperature_c": s.temperature_c,
            "relative_humidity_pct": s.relative_humidity_pct,
            "rot_pct": s.rot_incidence_pct,
            "sprout_pct": s.sprouting_incidence_pct,
            "weight_loss_pct": s.weight_loss_pct,
            "risk_level": s.deterioration_risk_level,
            "recorded_at": s.recorded_at.isoformat()
        })

    return QualityPassportResponse(
        id=passport.id,
        passport_uuid=passport.passport_uuid,
        lot_id=lot.id,
        lot_number=lot.lot_number,
        supplier={
            "id": lot.supplier.id if lot.supplier else "",
            "name": lot.supplier.name if lot.supplier else "N/A",
            "phone": lot.supplier.phone if lot.supplier else "N/A",
            "mandi_license": lot.supplier.mandi_license if lot.supplier else "N/A",
            "location": f"{lot.supplier.location}, {lot.supplier.district}, {lot.supplier.state}" if lot.supplier else "N/A"
        },
        center={
            "id": lot.center.id if lot.center else "",
            "code": lot.center.code if lot.center else "N/A",
            "name": lot.center.name if lot.center else "N/A",
            "state": lot.center.state if lot.center else "N/A",
            "district": lot.center.district if lot.center else "N/A"
        },
        grade_classification=passport.grade_classification,
        grade_a_pct=passport.grade_a_pct,
        urs_pct=passport.urs_pct,
        tamper_hash=passport.tamper_hash,
        is_locked=passport.is_locked,
        inspection_timeline=timeline,
        storage_history=storage_hist,
        qr_code_payload=passport.qr_code_payload,
        generated_at=passport.generated_at
    )
