from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.models import ProcurementRule, AuditLog
from app.schemas.schemas import ProcurementRuleCreate, ProcurementRuleResponse

router = APIRouter(prefix="/rules", tags=["Procurement Rules"])

@router.get("", response_model=List[ProcurementRuleResponse])
async def list_rules(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ProcurementRule).order_by(desc(ProcurementRule.created_at)))
    rules = res.scalars().all()
    return [ProcurementRuleResponse.model_validate(r) for r in rules]

@router.post("", response_model=ProcurementRuleResponse)
async def create_rule(payload: ProcurementRuleCreate, db: AsyncSession = Depends(get_db)):
    rule = ProcurementRule(
        rule_code=payload.rule_code,
        name=payload.name,
        version=payload.version,
        department=payload.department,
        is_active=payload.is_active,
        min_size_mm=payload.min_size_mm,
        max_undersized_tolerance_pct=payload.max_undersized_tolerance_pct,
        max_rot_tolerance_pct=payload.max_rot_tolerance_pct,
        max_damage_tolerance_pct=payload.max_damage_tolerance_pct,
        max_sprout_tolerance_pct=payload.max_sprout_tolerance_pct,
        max_total_defect_tolerance_pct=payload.max_total_defect_tolerance_pct,
        grade_a_definition=payload.grade_a_definition,
        urs_definition=payload.urs_definition
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return ProcurementRuleResponse.model_validate(rule)

@router.put("/{rule_id}/activate", response_model=ProcurementRuleResponse)
async def activate_rule(rule_id: str, db: AsyncSession = Depends(get_db)):
    # Deactivate all
    rules_res = await db.execute(select(ProcurementRule))
    all_rules = rules_res.scalars().all()
    for r in all_rules:
        r.is_active = (r.id == rule_id)
        
    target_rule = await db.get(ProcurementRule, rule_id)
    if not target_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    db.add(AuditLog(
        user_id=None,
        action="RULE_ACTIVATED",
        entity_type="ProcurementRule",
        entity_id=rule_id,
        description=f"Switched active procurement standard to {target_rule.name} ({target_rule.version})"
    ))
    
    await db.commit()
    await db.refresh(target_rule)
    return ProcurementRuleResponse.model_validate(target_rule)
