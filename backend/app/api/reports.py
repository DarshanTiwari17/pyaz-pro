from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import QualityReport, Lot, Inspection, User, ProcurementCenter, Supplier, InspectionImage, OnionDetection, WeightRecord

router = APIRouter(prefix="/reports", tags=["Quality Reports & Certification"])

@router.get("")
async def list_reports(db: AsyncSession = Depends(get_db)):
    query = (
        select(QualityReport)
        .options(
            selectinload(QualityReport.lot).selectinload(Lot.supplier),
            selectinload(QualityReport.lot).selectinload(Lot.center),
            selectinload(QualityReport.inspection)
        )
        .order_by(desc(QualityReport.generated_at))
    )
    res = await db.execute(query)
    reports = res.scalars().all()
    
    return [
        {
            "id": r.id,
            "report_number": r.report_number,
            "lot_id": r.lot_id,
            "lot_number": r.lot.lot_number if r.lot else "N/A",
            "supplier_name": r.lot.supplier.name if (r.lot and r.lot.supplier) else "N/A",
            "center_name": r.lot.center.name if (r.lot and r.lot.center) else "N/A",
            "grade_result": r.inspection.grade_result if r.inspection else "N/A",
            "grade_a_percentage": r.inspection.grade_a_percentage if r.inspection else 0.0,
            "urs_percentage": r.inspection.urs_percentage if r.inspection else 0.0,
            "rule_version_name": r.rule_version_name,
            "report_hash": r.report_hash,
            "is_tamper_verified": r.is_tamper_verified,
            "generated_at": r.generated_at.isoformat()
        }
        for r in reports
    ]

@router.get("/{report_id}")
async def get_report_detail(report_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(QualityReport)
        .options(
            selectinload(QualityReport.lot).selectinload(Lot.supplier),
            selectinload(QualityReport.lot).selectinload(Lot.center),
            selectinload(QualityReport.inspection).selectinload(Inspection.images).selectinload(InspectionImage.detections),
            selectinload(QualityReport.inspection).selectinload(Inspection.weight_record),
            selectinload(QualityReport.inspection).selectinload(Inspection.inspector)
        )
        .where(QualityReport.id == report_id)
    )
    rep = res.scalars().first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
        
    insp = rep.inspection
    lot = rep.lot
    
    return {
        "id": rep.id,
        "report_number": rep.report_number,
        "report_hash": rep.report_hash,
        "is_tamper_verified": rep.is_tamper_verified,
        "generated_at": rep.generated_at.isoformat(),
        "rule_version": rep.rule_version_name,
        "lot": {
            "lot_number": lot.lot_number,
            "variety": lot.variety,
            "quantity_mt": lot.initial_quantity_mt,
            "bag_count": lot.bag_count,
            "arrival_date": lot.arrival_date.isoformat() if lot.arrival_date else None,
            "current_grade": lot.current_grade
        },
        "supplier": {
            "name": lot.supplier.name if lot.supplier else "N/A",
            "phone": lot.supplier.phone if lot.supplier else "N/A",
            "mandi_license": lot.supplier.mandi_license if lot.supplier else "N/A",
            "location": lot.supplier.location if lot.supplier else "N/A"
        },
        "center": {
            "code": lot.center.code if lot.center else "N/A",
            "name": lot.center.name if lot.center else "N/A",
            "state": lot.center.state if lot.center else "N/A"
        },
        "inspection": {
            "inspection_number": insp.inspection_number,
            "inspector_name": insp.inspector.full_name if insp.inspector else "N/A",
            "confidence_score": insp.confidence_score,
            "grade_result": insp.grade_result,
            "grade_a_percentage": insp.grade_a_percentage,
            "urs_percentage": insp.urs_percentage,
            "counts": {
                "total": insp.total_detected_count,
                "healthy": insp.healthy_count,
                "rotten": insp.rotten_count,
                "damaged": insp.damaged_count,
                "sprouted": insp.sprouted_count,
                "undersized": insp.undersized_count
            },
            "weight": {
                "gross_kg": insp.weight_record.gross_sample_weight_kg if insp.weight_record else 0.0,
                "net_kg": insp.weight_record.net_sample_weight_kg if insp.weight_record else 0.0,
                "accepted_kg": insp.weight_record.accepted_weight_kg if insp.weight_record else 0.0,
                "rejected_kg": insp.weight_record.rejected_weight_kg if insp.weight_record else 0.0
            } if insp.weight_record else None
        }
    }
