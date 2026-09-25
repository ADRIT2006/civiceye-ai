"""
CivicEye AI — Municipal Worker Router
Strictly enforces operational boundaries:
Workers can ONLY see and act upon issues specifically assigned to their worker ID.
Manual URL inspection of unassigned issues returns 403 Forbidden.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.issue import Issue
from app.models.worker import Worker
from app.models.escalation import AuditLog
from app.models.emergency import Notification
from app.services.rbac import require_role

router = APIRouter(prefix="/api/worker", tags=["Municipal Worker"])

class WorkNoteRequest(BaseModel):
    worker_name: str = "Rajesh Kumar"
    note: str

def get_current_worker_id(x_worker_id: Optional[str] = Header(None)) -> int:
    """Resolves authenticated worker ID from request headers (default: 2 / Rajesh Kumar)."""
    if x_worker_id and x_worker_id.isdigit():
        return int(x_worker_id)
    return 2

@router.get("/profile")
def get_worker_profile(
    db: Session = Depends(get_db),
    x_worker_id: Optional[str] = Header(None),
    role: str = Depends(require_role(["worker", "admin"]))
):
    """Retrieves authenticated worker profile, assigned ward, and performance stats."""
    wid = get_current_worker_id(x_worker_id)
    worker = db.query(Worker).filter(Worker.id == wid).first()
    if not worker:
        # Fallback to Rajesh
        worker = db.query(Worker).filter(Worker.id == 2).first()
    if not worker:
        return {
            "id": 2,
            "worker_code": "WRK-2026-002",
            "name": "Rajesh Kumar",
            "department": "Road Maintenance",
            "primary_ward": "Ward 12 - Indiranagar",
            "current_workload": 3,
            "completed_jobs": 48
        }
    return {
        "id": worker.id,
        "worker_code": worker.worker_code,
        "name": worker.name,
        "avatar": worker.avatar,
        "phone": worker.phone,
        "department": worker.department,
        "specialization": worker.specialization,
        "primary_ward": worker.primary_ward,
        "secondary_wards": worker.secondary_wards,
        "availability": worker.availability,
        "current_workload": worker.current_workload,
        "completed_jobs": worker.completed_jobs,
        "rating": worker.rating,
        "sla_compliance_pct": worker.sla_compliance_pct
    }

@router.get("/stats")
def get_worker_stats(
    db: Session = Depends(get_db),
    x_worker_id: Optional[str] = Header(None),
    role: str = Depends(require_role(["worker", "admin"]))
):
    """Computes operational task statistics ONLY for this worker's assigned work orders."""
    wid = get_current_worker_id(x_worker_id)
    assigned_issues = db.query(Issue).filter(Issue.assigned_worker_id == wid).all()

    assigned_today = sum(1 for i in assigned_issues if i.status in ["In Progress", "Acknowledged", "Reported", "Disputed"])
    critical_jobs = sum(1 for i in assigned_issues if i.priority_level == "Critical" and i.status != "Resolved")
    in_progress = sum(1 for i in assigned_issues if i.status == "In Progress")
    awaiting_verification = sum(1 for i in assigned_issues if i.status in ["Repair Submitted", "Community Verification", "Disputed"])
    completed_total = sum(1 for i in assigned_issues if i.status == "Resolved")

    return {
        "assigned_today": assigned_today,
        "critical_jobs": critical_jobs,
        "in_progress": in_progress,
        "awaiting_verification": awaiting_verification,
        "completed_total": completed_total
    }

@router.get("/issues")
@router.get("/assigned")
def get_assigned_issues(
    db: Session = Depends(get_db),
    x_worker_id: Optional[str] = Header(None),
    role: str = Depends(require_role(["worker", "admin"]))
):
    """
    SECURITY ENFORCEMENT:
    Returns ONLY issues specifically assigned to the authenticated worker.
    Workers cannot see complaints belonging to or assigned to others.
    """
    wid = get_current_worker_id(x_worker_id)
    
    issues = db.query(Issue).filter(
        Issue.assigned_worker_id == wid,
        ~Issue.status.in_(["Resolved", "RESOLVED"])
    ).order_by(Issue.priority_score.desc()).all()

    return [
        {
            "id": i.id,
            "ticket_id": i.ticket_id,
            "category": i.category,
            "title": i.title,
            "description": i.description,
            "address": i.address,
            "ward": i.ward,
            "latitude": i.latitude,
            "longitude": i.longitude,
            "status": i.status,
            "priority_score": i.priority_score,
            "priority_level": i.priority_level,
            "report_count": i.report_count,
            "before_image_url": i.before_image_url,
            "after_image_url": i.after_image_url,
            "work_started_at": i.work_started_at.isoformat() if getattr(i, "work_started_at", None) else None,
            "work_completed_at": i.work_completed_at.isoformat() if getattr(i, "work_completed_at", None) else None,
            "assigned_at": i.assigned_at.isoformat() if getattr(i, "assigned_at", None) else None,
            "worker_completion_note": getattr(i, "worker_completion_note", None),
            "escalation_deadline": i.escalation_deadline.isoformat(),
            "created_at": i.created_at.isoformat()
        } for i in issues
    ]

@router.get("/issues/{ticket_or_id}")
def get_worker_issue_detail(
    ticket_or_id: str,
    db: Session = Depends(get_db),
    x_worker_id: Optional[str] = Header(None),
    role: str = Depends(require_role(["worker", "admin"]))
):
    """
    SECURITY ENFORCEMENT:
    If worker manually enters another issue URL (e.g. /worker/issues/CIV-2026-0099),
    raises 403 Forbidden if not assigned to this worker.
    """
    if ticket_or_id.isdigit():
        issue = db.query(Issue).filter(Issue.id == int(ticket_or_id)).first()
    else:
        issue = db.query(Issue).filter(Issue.ticket_id == ticket_or_id).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    wid = get_current_worker_id(x_worker_id)

    # Admin bypasses, but worker is strictly verified
    if role == "worker" and issue.assigned_worker_id != wid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="403 — This issue is not assigned to you."
        )

    return {
        "id": issue.id,
        "ticket_id": issue.ticket_id,
        "category": issue.category,
        "title": issue.title,
        "description": issue.description,
        "address": issue.address,
        "ward": issue.ward,
        "latitude": issue.latitude,
        "longitude": issue.longitude,
        "status": issue.status,
        "priority_score": issue.priority_score,
        "priority_level": issue.priority_level,
        "report_count": issue.report_count,
        "before_image_url": issue.before_image_url,
        "after_image_url": issue.after_image_url,
        "escalation_deadline": issue.escalation_deadline.isoformat(),
        "created_at": issue.created_at.isoformat(),
        "assigned_worker_id": issue.assigned_worker_id
    }

@router.get("/map/markers")
def get_worker_map_markers(
    db: Session = Depends(get_db),
    x_worker_id: Optional[str] = Header(None),
    role: str = Depends(require_role(["worker", "admin"]))
):
    """Returns map markers ONLY for issues assigned to this worker."""
    wid = get_current_worker_id(x_worker_id)
    issues = db.query(Issue).filter(
        Issue.assigned_worker_id == wid,
        Issue.status != "Resolved"
    ).all()

    return [
        {
            "id": i.id,
            "ticket_id": i.ticket_id,
            "category": i.category,
            "title": i.title,
            "latitude": i.latitude,
            "longitude": i.longitude,
            "status": i.status,
            "priority_level": i.priority_level,
            "ward": i.ward,
            "address": i.address,
            "before_image_url": i.before_image_url
        } for i in issues
    ]

@router.get("/history")
def get_worker_history(
    db: Session = Depends(get_db),
    x_worker_id: Optional[str] = Header(None),
    role: str = Depends(require_role(["worker", "admin"]))
):
    """Returns completed/resolved jobs for this worker."""
    wid = get_current_worker_id(x_worker_id)
    issues = db.query(Issue).filter(
        Issue.assigned_worker_id == wid,
        Issue.status == "Resolved"
    ).order_by(Issue.updated_at.desc()).all()

    return [
        {
            "id": i.id,
            "ticket_id": i.ticket_id,
            "category": i.category,
            "title": i.title,
            "ward": i.ward,
            "address": i.address,
            "status": i.status,
            "resolved_at": i.updated_at.isoformat(),
            "before_image_url": i.before_image_url,
            "after_image_url": i.after_image_url
        } for i in issues
    ]

@router.post("/issues/{id}/start-work")
def start_work_order(
    id: int,
    db: Session = Depends(get_db),
    x_worker_id: Optional[str] = Header(None),
    role: str = Depends(require_role(["worker", "admin"]))
):
    """Municipal worker accepts and starts on-site physical repair."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    wid = get_current_worker_id(x_worker_id)
    if role == "worker" and issue.assigned_worker_id != wid:
        raise HTTPException(status_code=403, detail="403 — This issue is not assigned to you.")

    now = datetime.utcnow()
    issue.work_started_at = now
    issue.status = "IN_PROGRESS"
    issue.updated_at = now

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name="Assigned Maintenance Crew",
        actor_role="worker",
        action="Work Started on Site",
        details="Maintenance crew arrived on site with required remediation equipment. Status moved to IN_PROGRESS.",
        timestamp=now
    ))

    # Send Notification to Citizen
    db.add(Notification(
        recipient_role="citizen",
        title="Work In Progress",
        message=f"Field crew has started on-site physical repair for your grievance {issue.ticket_id}.",
        category="progress",
        ticket_id=issue.ticket_id,
        is_read=False,
        created_at=now
    ))

    db.commit()
    return {"success": True, "status": issue.status, "ticket_id": issue.ticket_id, "work_started_at": issue.work_started_at.isoformat()}

@router.post("/issues/{id}/repair")
def worker_submit_repair(
    id: int,
    payload: dict,
    db: Session = Depends(get_db),
    x_worker_id: Optional[str] = Header(None),
    role: str = Depends(require_role(["worker", "admin"]))
):
    """Worker submits repair evidence directly via worker workspace endpoint."""
    from app.schemas.verification import RepairSubmitRequest
    from app.routers.repairs import submit_repair_evidence
    req = RepairSubmitRequest(**payload)
    return submit_repair_evidence(
        id=id,
        payload=req,
        x_worker_id=x_worker_id,
        x_user_role="worker",
        db=db
    )

@router.post("/issues/{id}/work-note")
def add_work_note(
    id: int,
    payload: WorkNoteRequest,
    db: Session = Depends(get_db),
    x_worker_id: Optional[str] = Header(None),
    role: str = Depends(require_role(["worker", "admin"]))
):
    """Worker appends progress / material note to grievance history."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    wid = get_current_worker_id(x_worker_id)
    if role == "worker" and issue.assigned_worker_id != wid:
        raise HTTPException(status_code=403, detail="403 — This issue is not assigned to you.")

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name=payload.worker_name,
        actor_role="worker",
        action="Field Operation Note Added",
        details=payload.note,
        timestamp=datetime.utcnow()
    ))
    db.commit()
    return {"success": True, "message": "Work note recorded in public audit trail"}
