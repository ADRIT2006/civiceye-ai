import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.models.user import User
from app.models.issue import Issue
from app.models.verification import RepairSubmission
from app.models.escalation import Escalation
from app.models.emergency import EmergencyContact, Notification
from app.services.demo_seed import seed_demo_database
from app.services.db_migration import run_safe_db_migrations
from app.routers import issues, repairs, escalations, admin, analytics, demo, worker, emergency, reports, credits, copilot

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "civiceye.db")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run safe schema migrations, create tables and seed demo data
    run_safe_db_migrations(DB_PATH)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_database(db)
    finally:
        db.close()
    
    print("\n" + "=" * 45)
    print("CivicEye AI Production Backend")
    print("Database: Connected")
    print("Status: Active")
    print("API: Ready")
    print("Server: http://127.0.0.1:8000")
    print("Docs: http://127.0.0.1:8000/docs")
    print("=" * 45 + "\n")
    yield
    print("[CivicEye AI] Shutting down backend server...")

app = FastAPI(
    title=settings.APP_NAME,
    description="Civic Issue Escalation & Public Accountability Platform — Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
custom_origin = os.environ.get("CORS_ORIGIN")
if custom_origin and custom_origin not in CORS_ORIGINS:
    CORS_ORIGINS.append(custom_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(issues.router)
app.include_router(issues.citizen_router)
app.include_router(repairs.router)
app.include_router(escalations.router)
app.include_router(admin.router)
app.include_router(reports.router)
app.include_router(credits.router)
app.include_router(copilot.router)
app.include_router(analytics.router)
app.include_router(demo.router)
app.include_router(worker.router)
app.include_router(emergency.router)

@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "service": "CivicEye AI",
        "escalation_hours": settings.ESCALATION_HOURS
    }

@app.get("/api/workers", tags=["System"])
def get_workers_alias(db: Session = Depends(get_db)):
    from app.models.worker import Worker
    workers = db.query(Worker).order_by(Worker.name.asc()).all()
    return [
        {
            "id": w.id,
            "worker_code": w.worker_code,
            "name": w.name,
            "avatar": w.avatar,
            "phone": w.phone,
            "department": w.department,
            "specialization": w.specialization,
            "primary_ward": w.primary_ward,
            "secondary_wards": w.secondary_wards,
            "availability": w.availability,
            "current_workload": w.current_workload,
            "completed_jobs": w.completed_jobs,
            "rating": w.rating,
            "sla_compliance_pct": w.sla_compliance_pct,
            "status": w.status
        } for w in workers
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
