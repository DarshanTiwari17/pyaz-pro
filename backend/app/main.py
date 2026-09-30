import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.api.seed_data import seed_database

# Routers
from app.api.auth import router as auth_router
from app.api.lots import router as lots_router
from app.api.inspections import router as inspections_router
from app.api.reinspections import router as reinspections_router
from app.api.quality_passports import router as quality_passports_router
from app.api.reports import router as reports_router
from app.api.storage import router as storage_router
from app.api.analytics import router as analytics_router
from app.api.models_api import router as models_router
from app.api.audit import router as audit_router
from app.api.rules import router as rules_router
from app.api.users import router as users_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Seed default data
    async with AsyncSessionLocal() as session:
        await seed_database(session)
        
    yield

app = FastAPI(
    title="PYAAZ-PRO API",
    description="AI-Powered Onion Quality Assessment, Grading, Traceability, and Post-Procurement Intelligence (DoCA Standard)",
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

# CORS middleware for frontend communication (supports Vercel production & preview deployments)
cors_origins = [
    "https://pyaz-pro.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
]

env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    cors_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads and generated reports
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
app.mount("/storage", StaticFiles(directory=settings.STORAGE_DIR), name="storage")

# Include API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(lots_router, prefix=settings.API_V1_STR)
app.include_router(inspections_router, prefix=settings.API_V1_STR)
app.include_router(reinspections_router, prefix=settings.API_V1_STR)
app.include_router(quality_passports_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(storage_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(rules_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "product": "PYAAZ-PRO",
        "tagline": "AI-Powered Onion Quality & Procurement Intelligence",
        "status": "OPERATIONAL",
        "doca_problem_statement_id": "26031",
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pyaaz-pro-backend"}
