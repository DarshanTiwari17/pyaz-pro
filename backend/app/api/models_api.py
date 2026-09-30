from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.models import ModelArtifact, Dataset
from app.services.eval_engine import eval_engine

router = APIRouter(prefix="/models", tags=["AI Models & Evaluation Hub"])

@router.get("", response_model=List[Dict[str, Any]])
async def list_models(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ModelArtifact).order_by(desc(ModelArtifact.created_at)))
    models = res.scalars().all()
    
    return [
        {
            "id": m.id,
            "model_name": m.model_name,
            "version": m.version,
            "architecture": m.architecture,
            "dataset_version": m.dataset_version,
            "training_date": m.training_date.isoformat(),
            "evaluation_date": m.evaluation_date.isoformat(),
            "precision": m.precision,
            "recall": m.recall,
            "f1_score": m.f1_score,
            "map50": m.map50,
            "map50_95": m.map50_95,
            "is_production": m.is_production,
            "confusion_matrix": m.confusion_matrix_json,
            "per_class_metrics": m.per_class_metrics_json
        }
        for m in models
    ]

@router.get("/evaluation/active")
async def get_active_model_evaluation(db: AsyncSession = Depends(get_db)):
    """Fetches full operational ML monitoring evaluation for production model"""
    res = await db.execute(select(ModelArtifact).where(ModelArtifact.is_production == True))
    model = res.scalars().first()
    
    if not model:
        # Check if benchmark is available
        bench = eval_engine.get_standard_benchmark_evaluation()
        return bench
        
    return {
        "model_name": model.model_name,
        "version": model.version,
        "architecture": model.architecture,
        "dataset_version": model.dataset_version,
        "precision": model.precision,
        "recall": model.recall,
        "f1_score": model.f1_score,
        "map50": model.map50,
        "map50_95": model.map50_95,
        "inference_time_ms": 38.5,
        "confusion_matrix": model.confusion_matrix_json,
        "per_class_metrics": model.per_class_metrics_json,
        "evaluation_date": model.evaluation_date.isoformat()
    }

@router.get("/datasets")
async def list_datasets(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Dataset).order_by(desc(Dataset.created_at)))
    datasets = res.scalars().all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "version": d.version,
            "sample_count": d.sample_count,
            "class_distribution": d.class_distribution_json,
            "train_split": f"{d.train_split_pct}%",
            "val_split": f"{d.val_split_pct}%",
            "test_split": f"{d.test_split_pct}%",
            "created_at": d.created_at.isoformat()
        }
        for d in datasets
    ]
