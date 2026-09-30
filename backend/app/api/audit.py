from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import AuditLog, User
from app.schemas.schemas import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit Logs & Traceability"])

@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog).options(selectinload(AuditLog.user)).order_by(desc(AuditLog.created_at))
    
    if action:
        query = query.where(AuditLog.action == action)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
        
    res = await db.execute(query)
    logs = res.scalars().all()
    
    return [
        AuditLogResponse(
            id=l.id,
            user_id=l.user_id,
            user_name=l.user.full_name if l.user else "System Automation",
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            ip_address=l.ip_address,
            description=l.description,
            metadata=l.metadata_json or {},
            created_at=l.created_at
        )
        for l in logs
    ]
