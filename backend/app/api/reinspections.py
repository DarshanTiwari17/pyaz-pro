import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import Reinspection, Inspection, Lot, User, AuditLog
from app.schemas.schemas import ReinspectionCreate, ReinspectionResponse, ReinspectionDecision

router = APIRouter(prefix="/reinspections", tags=["Reinspection & Dispute Resolution"])

@router.get("", response_model=List[ReinspectionResponse])
async def list_reinspections(db: AsyncSession = Depends(get_db)):
    query = (
        select(Reinspection)
        .options(
            selectinload(Reinspection.original_inspection),
            selectinload(Reinspection.original_inspection).selectinload(Inspection.lot)
        )
        .order_by(desc(Reinspection.created_at))
    )
    result = await db.execute(query)
    reinsps = result.scalars().all()
    
    response = []
    for r in reinsps:
        insp = r.original_inspection
        lot = insp.lot if insp else None
        
        # Get inspector / supervisor names
        inspector = await db.get(User, r.inspector_id) if r.inspector_id else None
        supervisor = await db.get(User, r.supervisor_id) if r.supervisor_id else None
        
        response.append(ReinspectionResponse(
            id=r.id,
            reinspection_number=r.reinspection_number,
            original_inspection_id=r.original_inspection_id,
            lot_id=r.lot_id,
            lot_number=lot.lot_number if lot else "Unknown Lot",
            inspector_id=r.inspector_id,
            inspector_name=inspector.full_name if inspector else None,
            supervisor_id=r.supervisor_id,
            supervisor_name=supervisor.full_name if supervisor else None,
            reason_code=r.reason_code,
            reason_description=r.reason_description,
            original_grade=r.original_grade,
            new_grade=r.new_grade,
            status=r.status,
            supervisor_decision=r.supervisor_decision,
            supervisor_remarks=r.supervisor_remarks,
            created_at=r.created_at,
            finalized_at=r.finalized_at
        ))
    return response

@router.post("", response_model=ReinspectionResponse)
async def create_reinspection_request(
    payload: ReinspectionCreate,
    inspector_id: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    insp = await db.get(Inspection, payload.original_inspection_id)
    if not insp:
        raise HTTPException(status_code=404, detail="Original inspection not found")
        
    lot = await db.get(Lot, insp.lot_id)
    
    re_num = f"REINSP-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    re_rec = Reinspection(
        reinspection_number=re_num,
        original_inspection_id=payload.original_inspection_id,
        lot_id=insp.lot_id,
        inspector_id=inspector_id,
        reason_code=payload.reason_code,
        reason_description=payload.reason_description,
        original_grade=insp.grade_result or "GRADE_A",
        status="PENDING_REVIEW"
    )
    db.add(re_rec)
    
    # Mark Lot as under dispute
    lot.status = "REINSPECTION_REQUESTED"
    
    # Audit log
    db.add(AuditLog(
        user_id=inspector_id,
        action="REINSPECTION_FILED",
        entity_type="Reinspection",
        entity_id=re_rec.id,
        description=f"Filed reinspection {re_num} for Lot {lot.lot_number}. Reason: {payload.reason_code}"
    ))
    
    await db.commit()
    await db.refresh(re_rec)
    
    return ReinspectionResponse(
        id=re_rec.id,
        reinspection_number=re_rec.reinspection_number,
        original_inspection_id=re_rec.original_inspection_id,
        lot_id=re_rec.lot_id,
        lot_number=lot.lot_number,
        inspector_id=re_rec.inspector_id,
        inspector_name=None,
        supervisor_id=None,
        supervisor_name=None,
        reason_code=re_rec.reason_code,
        reason_description=re_rec.reason_description,
        original_grade=re_rec.original_grade,
        new_grade=None,
        status=re_rec.status,
        supervisor_decision=None,
        supervisor_remarks=None,
        created_at=re_rec.created_at,
        finalized_at=None
    )

@router.post("/{reinspection_id}/decision", response_model=ReinspectionResponse)
async def supervisor_decision(
    reinspection_id: str,
    payload: ReinspectionDecision,
    supervisor_id: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    re_rec = await db.get(Reinspection, reinspection_id)
    if not re_rec:
        raise HTTPException(status_code=404, detail="Reinspection record not found")
        
    lot = await db.get(Lot, re_rec.lot_id)
    now = datetime.now(timezone.utc)
    
    re_rec.supervisor_id = supervisor_id
    re_rec.status = payload.status
    re_rec.new_grade = payload.new_grade
    re_rec.supervisor_decision = payload.status
    re_rec.supervisor_remarks = payload.supervisor_remarks
    re_rec.finalized_at = now
    
    if payload.status == "APPROVED_NEW_GRADE" and payload.new_grade:
        lot.current_grade = payload.new_grade
        lot.status = "APPROVED"
    elif payload.status == "UPHELD_ORIGINAL":
        lot.current_grade = re_rec.original_grade
        lot.status = "APPROVED"
    elif payload.status == "REJECTED":
        lot.current_grade = "REJECTED"
        lot.status = "REJECTED"
        
    db.add(AuditLog(
        user_id=supervisor_id,
        action="REINSPECTION_DECIDED",
        entity_type="Reinspection",
        entity_id=re_rec.id,
        description=f"Supervisor ruled '{payload.status}' on reinspection {re_rec.reinspection_number}. Remarks: {payload.supervisor_remarks}"
    ))
    
    await db.commit()
    await db.refresh(re_rec)
    
    supervisor = await db.get(User, supervisor_id)
    return ReinspectionResponse(
        id=re_rec.id,
        reinspection_number=re_rec.reinspection_number,
        original_inspection_id=re_rec.original_inspection_id,
        lot_id=re_rec.lot_id,
        lot_number=lot.lot_number if lot else None,
        inspector_id=re_rec.inspector_id,
        inspector_name=None,
        supervisor_id=supervisor_id,
        supervisor_name=supervisor.full_name if supervisor else None,
        reason_code=re_rec.reason_code,
        reason_description=re_rec.reason_description,
        original_grade=re_rec.original_grade,
        new_grade=re_rec.new_grade,
        status=re_rec.status,
        supervisor_decision=re_rec.supervisor_decision,
        supervisor_remarks=re_rec.supervisor_remarks,
        created_at=re_rec.created_at,
        finalized_at=re_rec.finalized_at
    )
