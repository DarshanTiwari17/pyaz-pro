from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.models import Lot, Inspection, Reinspection, StorageReading, ProcurementCenter, Supplier

router = APIRouter(prefix="/analytics", tags=["Operational Analytics & Executive Intelligence"])

@router.get("/summary")
async def get_analytics_summary(db: AsyncSession = Depends(get_db)):
    # Total lots and volume
    lots_res = await db.execute(select(Lot))
    lots = lots_res.scalars().all()
    
    total_lots = len(lots)
    total_volume_mt = round(sum(l.initial_quantity_mt for l in lots), 1)
    
    # Inspections
    insps_res = await db.execute(select(Inspection))
    insps = insps_res.scalars().all()
    
    total_inspections = len(insps)
    grade_a_count = sum(1 for i in insps if i.grade_result == "GRADE_A")
    urs_count = sum(1 for i in insps if i.grade_result == "URS")
    rejected_count = sum(1 for i in insps if i.grade_result == "REJECTED")
    
    avg_grade_a = round(sum(i.grade_a_percentage for i in insps) / max(1, total_inspections), 1)
    avg_urs = round(sum(i.urs_percentage for i in insps) / max(1, total_inspections), 1)
    
    # Defect breakdown aggregate
    total_healthy = sum(i.healthy_count for i in insps)
    total_rotten = sum(i.rotten_count for i in insps)
    total_damaged = sum(i.damaged_count for i in insps)
    total_sprouted = sum(i.sprouted_count for i in insps)
    total_undersized = sum(i.undersized_count for i in insps)
    all_bulbs = max(1, total_healthy + total_rotten + total_damaged + total_sprouted + total_undersized)
    
    # Reinspections
    reinsp_res = await db.execute(select(Reinspection))
    reinsps = reinsp_res.scalars().all()
    reinspection_count = len(reinsps)
    reinspection_rate = round((reinspection_count / max(1, total_inspections)) * 100, 1)
    
    # Storage Risk breakdown
    storage_res = await db.execute(select(StorageReading))
    storage_readings = storage_res.scalars().all()
    
    high_risk_storage = sum(1 for s in storage_readings if s.deterioration_risk_level == "HIGH")
    medium_risk_storage = sum(1 for s in storage_readings if s.deterioration_risk_level == "MEDIUM")
    low_risk_storage = sum(1 for s in storage_readings if s.deterioration_risk_level == "LOW")
    
    # Center-wise comparison
    centers_res = await db.execute(select(ProcurementCenter))
    centers = centers_res.scalars().all()
    
    center_metrics = []
    for c in centers:
        c_lots = [l for l in lots if l.center_id == c.id]
        c_vol = sum(l.initial_quantity_mt for l in c_lots)
        c_insps = [i for i in insps if i.center_id == c.id]
        c_avg_a = round(sum(i.grade_a_percentage for i in c_insps) / max(1, len(c_insps)), 1) if c_insps else 0.0
        center_metrics.append({
            "center_name": c.name,
            "center_code": c.code,
            "state": c.state,
            "lot_count": len(c_lots),
            "total_volume_mt": round(c_vol, 1),
            "avg_grade_a_pct": c_avg_a
        })

    return {
        "kpis": {
            "total_lots_inspected": total_lots,
            "total_quantity_mt": total_volume_mt,
            "avg_grade_a_pct": avg_grade_a,
            "avg_urs_pct": avg_urs,
            "reinspection_count": reinspection_count,
            "reinspection_rate_pct": reinspection_rate,
            "high_risk_storage_lots": high_risk_storage
        },
        "grade_distribution": [
            {"name": "Grade A", "value": grade_a_count, "color": "#1E4D2B"},
            {"name": "URS (Under-grade)", "value": urs_count, "color": "#D97706"},
            {"name": "Rejected", "value": rejected_count, "color": "#DC2626"}
        ],
        "defect_distribution": [
            {"name": "Healthy", "count": total_healthy, "percentage": round(total_healthy / all_bulbs * 100, 1)},
            {"name": "Undersized (<45mm)", "count": total_undersized, "percentage": round(total_undersized / all_bulbs * 100, 1)},
            {"name": "Damaged", "count": total_damaged, "percentage": round(total_damaged / all_bulbs * 100, 1)},
            {"name": "Sprouted", "count": total_sprouted, "percentage": round(total_sprouted / all_bulbs * 100, 1)},
            {"name": "Rotten / Necrotic", "count": total_rotten, "percentage": round(total_rotten / all_bulbs * 100, 1)}
        ],
        "storage_risks": [
            {"name": "Low Risk", "value": max(1, low_risk_storage), "color": "#16A34A"},
            {"name": "Medium Risk", "value": medium_risk_storage, "color": "#CA8A04"},
            {"name": "High Alert", "value": high_risk_storage, "color": "#DC2626"}
        ],
        "center_comparison": center_metrics,
        "historical_quality_trends": [
            {"week": "W1", "grade_a": 81.2, "urs": 18.8, "volume_mt": 185.0},
            {"week": "W2", "grade_a": 83.5, "urs": 16.5, "volume_mt": 240.5},
            {"week": "W3", "grade_a": 79.8, "urs": 20.2, "volume_mt": 310.0},
            {"week": "W4", "grade_a": 84.5, "urs": 15.5, "volume_mt": 420.0}
        ]
    }
