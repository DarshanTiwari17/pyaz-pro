import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import Lot, Supplier, ProcurementCenter, Sample, Inspection, AuditLog
from app.schemas.schemas import LotCreate, LotResponse, SampleCreate, SampleResponse

router = APIRouter(prefix="/lots", tags=["Lots & Suppliers"])

@router.get("", response_model=List[LotResponse])
async def list_lots(
    center_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Lot).options(selectinload(Lot.supplier), selectinload(Lot.center)).order_by(desc(Lot.created_at))
    
    if center_id:
        query = query.where(Lot.center_id == center_id)
    if status:
        query = query.where(Lot.status == status)
        
    result = await db.execute(query)
    lots = result.scalars().all()
    
    response = []
    for l in lots:
        if search:
            s_lower = search.lower()
            if s_lower not in l.lot_number.lower() and s_lower not in (l.supplier.name.lower() if l.supplier else ""):
                continue
        response.append(LotResponse(
            id=l.id,
            lot_number=l.lot_number,
            supplier_id=l.supplier_id,
            supplier_name=l.supplier.name if l.supplier else "Unknown Supplier",
            center_id=l.center_id,
            center_name=l.center.name if l.center else "Unknown Center",
            initial_quantity_mt=l.initial_quantity_mt,
            bag_count=l.bag_count,
            variety=l.variety,
            harvested_date=l.harvested_date,
            arrival_date=l.arrival_date,
            status=l.status,
            current_grade=l.current_grade,
            grade_a_percentage=l.grade_a_percentage,
            urs_percentage=l.urs_percentage,
            created_at=l.created_at
        ))
    return response

@router.post("", response_model=LotResponse)
async def create_lot(payload: LotCreate, db: AsyncSession = Depends(get_db)):
    # Generate human readable Lot number if omitted
    now = datetime.now(timezone.utc)
    lot_num = payload.lot_number or f"LOT-{now.year}-MANDI-{uuid.uuid4().hex[:6].upper()}"
    
    new_lot = Lot(
        lot_number=lot_num,
        supplier_id=payload.supplier_id,
        center_id=payload.center_id,
        initial_quantity_mt=payload.initial_quantity_mt,
        bag_count=payload.bag_count,
        variety=payload.variety,
        harvested_date=payload.harvested_date,
        arrival_date=now,
        status="PENDING_INSPECTION"
    )
    db.add(new_lot)
    await db.flush()
    
    # Audit log
    db.add(AuditLog(
        user_id=None,
        action="LOT_CREATED",
        entity_type="Lot",
        entity_id=new_lot.id,
        description=f"Created Lot {lot_num} with {payload.initial_quantity_mt} MT ({payload.bag_count} bags)"
    ))
    
    await db.commit()
    await db.refresh(new_lot)
    
    # Fetch supplier and center info
    sup = await db.get(Supplier, new_lot.supplier_id)
    center = await db.get(ProcurementCenter, new_lot.center_id)
    
    return LotResponse(
        id=new_lot.id,
        lot_number=new_lot.lot_number,
        supplier_id=new_lot.supplier_id,
        supplier_name=sup.name if sup else None,
        center_id=new_lot.center_id,
        center_name=center.name if center else None,
        initial_quantity_mt=new_lot.initial_quantity_mt,
        bag_count=new_lot.bag_count,
        variety=new_lot.variety,
        harvested_date=new_lot.harvested_date,
        arrival_date=new_lot.arrival_date,
        status=new_lot.status,
        current_grade=new_lot.current_grade,
        grade_a_percentage=new_lot.grade_a_percentage,
        urs_percentage=new_lot.urs_percentage,
        created_at=new_lot.created_at
    )

@router.get("/{lot_id}", response_model=LotResponse)
async def get_lot(lot_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Lot)
        .options(selectinload(Lot.supplier), selectinload(Lot.center))
        .where(Lot.id == lot_id)
    )
    lot = result.scalars().first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
        
    return LotResponse(
        id=lot.id,
        lot_number=lot.lot_number,
        supplier_id=lot.supplier_id,
        supplier_name=lot.supplier.name if lot.supplier else None,
        center_id=lot.center_id,
        center_name=lot.center.name if lot.center else None,
        initial_quantity_mt=lot.initial_quantity_mt,
        bag_count=lot.bag_count,
        variety=lot.variety,
        harvested_date=lot.harvested_date,
        arrival_date=lot.arrival_date,
        status=lot.status,
        current_grade=lot.current_grade,
        grade_a_percentage=lot.grade_a_percentage,
        urs_percentage=lot.urs_percentage,
        created_at=lot.created_at
    )

@router.post("/samples", response_model=SampleResponse)
async def create_sample(payload: SampleCreate, inspector_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    sample_code = f"SMP-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    sample = Sample(
        lot_id=payload.lot_id,
        sample_code=sample_code,
        sample_weight_kg=payload.sample_weight_kg,
        sample_onion_count=payload.sample_onion_count,
        sampling_method=payload.sampling_method,
        bag_sample_locations=payload.bag_sample_locations,
        inspector_id=inspector_id
    )
    db.add(sample)
    await db.commit()
    await db.refresh(sample)
    return SampleResponse.model_validate(sample)
