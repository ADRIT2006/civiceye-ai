"""
CivicEye AI — Admin Command Center Router
Manages municipal personnel directory (25+ workers), smart AI worker assignment,
ward GeoJSON boundary analytics, audit trails, and repair overrides.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.database import get_db
from app.models.issue import Issue
from app.models.worker import Worker
from app.models.user import User
from app.models.escalation import AuditLog
from app.models.emergency import Notification
from app.models.verification import RepairSubmission
from app.services.escalation_engine import trigger_issue_escalation
from app.services.smart_assignment import recommend_workers_for_issue
from app.services.ward_service import get_geojson_feature_collection, WARD_POLYGONS
from app.services.rbac import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_role(["admin"]))])

class AssignWorkerRequest(BaseModel):
    worker_id: int
    worker_name: Optional[str] = None
    department: Optional[str] = None
    priority: Optional[str] = "High"
    expected_completion: Optional[str] = "Within 24 Hours"
    instructions: Optional[str] = None
    assigned_by: Optional[str] = "Dr. Arvind Verma (Commissioner)"

class AdminDecisionRequest(BaseModel):
    admin_notes: str
    action_by: str = "Dr. Arvind Verma (Commissioner)"

class UpdateWorkerRequest(BaseModel):
    primary_ward: Optional[str] = None
    secondary_wards: Optional[str] = None
    availability: Optional[str] = None
    status: Optional[str] = None

@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Computes dynamic real database summary for the admin command center."""
    issues = db.query(Issue).all()
    workers = db.query(Worker).all()

    total_issues = len(issues)
    open_issues = sum(1 for i in issues if (i.status or '').upper() not in ["RESOLVED"])
    critical_issues = sum(1 for i in issues if (i.priority_level or '').upper() == "CRITICAL" and (i.status or '').upper() not in ["RESOLVED"])
    unassigned_issues = sum(1 for i in issues if not i.assigned_worker_id and (i.status or '').upper() not in ["RESOLVED"])
    escalated_issues = sum(1 for i in issues if (i.status or '').upper() == "ESCALATED")
    resolved_issues_count = sum(1 for i in issues if (i.status or '').upper() == "RESOLVED")

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    resolved_today = sum(1 for i in issues if (i.status or '').upper() == "RESOLVED" and i.updated_at and i.updated_at >= today_start)

    available_workers = sum(1 for w in workers if (w.availability or '').capitalize() == "Available" and (w.status or '').capitalize() == "Active")

    resolved_issues = [i for i in issues if (i.status or '').upper() == "RESOLVED" and i.created_at and i.updated_at]
    if resolved_issues:
        total_hours = sum((i.updated_at - i.created_at).total_seconds() / 3600.0 for i in resolved_issues)
        avg_res_time = round(total_hours / len(resolved_issues), 1)
    else:
        avg_res_time = 0.0

    return {
        "total_issues": total_issues,
        "open_issues": open_issues,
        "critical_issues": critical_issues,
        "unassigned_issues": unassigned_issues,
        "escalated_issues": escalated_issues,
        "resolved_issues": resolved_issues_count,
        "resolved_today": resolved_today,
        "available_workers": available_workers,
        "average_resolution_time": avg_res_time
    }

@router.get("/workers")
def get_municipal_workers(
    department: Optional[str] = Query(None),
    ward: Optional[str] = Query(None),
    availability: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Lists registered maintenance crew personnel with administrative filtering."""
    q = db.query(Worker)

    if department and department != "All":
        q = q.filter(Worker.department == department)
    if ward and ward != "All":
        q = q.filter(Worker.primary_ward.ilike(f"%{ward}%"))
    if availability and availability != "All":
        q = q.filter(Worker.availability == availability)

    workers = q.order_by(Worker.current_workload.asc(), Worker.name.asc()).all()

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
            "avg_resolution_hours": w.avg_resolution_hours,
            "rating": w.rating,
            "sla_compliance_pct": w.sla_compliance_pct,
            "status": w.status
        } for w in workers
    ]

@router.get("/issues")
def get_admin_issues(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    ward: Optional[str] = Query(None),
    assigned_state: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Admin view of all municipal issues with comprehensive multi-criteria filtering."""
    q = db.query(Issue)
    if category and category != "All":
        q = q.filter(Issue.category == category)
    if status and status != "All":
        q = q.filter(Issue.status.ilike(status))
    if priority and priority != "All":
        q = q.filter(Issue.priority_level.ilike(priority))
    if ward and ward != "All":
        q = q.filter(Issue.ward.ilike(f"%{ward}%"))
    if assigned_state and assigned_state != "All":
        if assigned_state == "Assigned":
            q = q.filter(Issue.assigned_worker_id.isnot(None))
        elif assigned_state == "Unassigned":
            q = q.filter(Issue.assigned_worker_id.is_(None))
    if search and search.strip():
        s = f"%{search.strip()}%"
        q = q.filter(
            (Issue.ticket_id.ilike(s)) |
            (Issue.title.ilike(s)) |
            (Issue.description.ilike(s)) |
            (Issue.address.ilike(s))
        )
    if date_from:
        try:
            df = datetime.fromisoformat(date_from)
            q = q.filter(Issue.created_at >= df)
        except Exception:
            pass
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            q = q.filter(Issue.created_at <= dt)
        except Exception:
            pass

    issues = q.order_by(Issue.created_at.desc()).all()
    workers_map = {w.id: w.name for w in db.query(Worker).all()}

    return [
        {
            "id": i.id,
            "ticket_id": i.ticket_id,
            "category": i.category,
            "title": i.title,
            "description": i.description,
            "latitude": i.latitude,
            "longitude": i.longitude,
            "address": i.address,
            "ward": i.ward,
            "ward_id": getattr(i, "ward_id", None),
            "status": i.status,
            "priority_score": i.priority_score,
            "priority_level": i.priority_level,
            "report_count": i.report_count,
            "support_count": getattr(i, "support_count", i.upvotes),
            "assigned_worker_id": i.assigned_worker_id,
            "assigned_worker_name": workers_map.get(i.assigned_worker_id) if i.assigned_worker_id else None,
            "reporter_name": i.reporter_name,
            "before_image_url": i.before_image_url,
            "after_image_url": i.after_image_url,
            "escalation_deadline": i.escalation_deadline.isoformat() if i.escalation_deadline else None,
            "escalation_due_at": (i.escalation_due_at or i.escalation_deadline).isoformat() if (i.escalation_due_at or i.escalation_deadline) else None,
            "created_at": i.created_at.isoformat() if i.created_at else None,
            "updated_at": i.updated_at.isoformat() if i.updated_at else None
        } for i in issues
    ]

@router.get("/workers/{id}")
def get_worker_detail(id: int, db: Session = Depends(get_db)):
    """Retrieves single worker profile, stats, and assigned tasks history."""
    worker = db.query(Worker).filter(Worker.id == id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    assigned_tasks = db.query(Issue).filter(Issue.assigned_worker_id == worker.id).all()

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
        "avg_resolution_hours": worker.avg_resolution_hours,
        "rating": worker.rating,
        "sla_compliance_pct": worker.sla_compliance_pct,
        "status": worker.status,
        "assigned_issues": [
            {
                "id": t.id,
                "ticket_id": t.ticket_id,
                "title": t.title,
                "category": t.category,
                "ward": t.ward,
                "status": t.status,
                "priority_level": t.priority_level,
                "created_at": t.created_at.isoformat()
            } for t in assigned_tasks
        ]
    }

@router.patch("/workers/{id}")
def update_worker_status(id: int, payload: UpdateWorkerRequest, db: Session = Depends(get_db)):
    """Admin updates worker's assigned ward, availability, or operational status."""
    worker = db.query(Worker).filter(Worker.id == id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if payload.primary_ward is not None:
        worker.primary_ward = payload.primary_ward
    if payload.secondary_wards is not None:
        worker.secondary_wards = payload.secondary_wards
    if payload.availability is not None:
        worker.availability = payload.availability
    if payload.status is not None:
        worker.status = payload.status

    worker.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(worker)

    return {
        "success": True,
        "message": f"Worker {worker.name} profile updated successfully.",
        "worker": {
            "id": worker.id,
            "primary_ward": worker.primary_ward,
            "availability": worker.availability,
            "status": worker.status
        }
    }

@router.get("/issues/{ticket_or_id}/recommended-workers")
def get_recommended_workers_for_issue(ticket_or_id: str, db: Session = Depends(get_db)):
    """AI smart worker recommendation matching category, ward, workload, and availability."""
    issue = None
    if str(ticket_or_id).isdigit():
        issue = db.query(Issue).filter(Issue.id == int(ticket_or_id)).first()
    if not issue:
        issue = db.query(Issue).filter(Issue.ticket_id == str(ticket_or_id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    current_worker = None
    if issue.assigned_worker_id:
        curr_w = db.query(Worker).filter(Worker.id == issue.assigned_worker_id).first()
        if curr_w:
            current_worker = {
                "id": curr_w.id,
                "name": curr_w.name,
                "worker_code": curr_w.worker_code,
                "department": curr_w.department,
                "primary_ward": curr_w.primary_ward,
                "availability": curr_w.availability,
                "current_workload": curr_w.current_workload
            }

    recommendations = recommend_workers_for_issue(db, issue, limit=5)
    return {
        "issue_id": issue.id,
        "ticket_id": issue.ticket_id,
        "category": issue.category,
        "ward": issue.ward,
        "priority_level": issue.priority_level,
        "status": issue.status,
        "latitude": issue.latitude,
        "longitude": issue.longitude,
        "assigned_worker_id": issue.assigned_worker_id,
        "current_assigned_worker": current_worker,
        "recommendations": recommendations
    }

@router.get("/ward-map/stats")
def get_ward_map_statistics(db: Session = Depends(get_db)):
    """Returns GeoJSON polygons enriched with real-time issue statistics."""
    geojson = get_geojson_feature_collection()
    issues = db.query(Issue).all()
    workers = db.query(Worker).filter(Worker.status == "Active").all()

    active_ward_list = list(WARD_POLYGONS)
    if not active_ward_list:
        db_wards = set()
        for i in issues:
            if i.ward and i.ward != "Ward boundary data unavailable":
                db_wards.add(i.ward)
        for w in workers:
            if w.primary_ward:
                db_wards.add(w.primary_ward)
        for idx, wname in enumerate(sorted(db_wards)):
            active_ward_list.append({
                "id": f"WARD-{idx+1:02d}",
                "name": wname,
                "zone": "Municipal Zone",
                "color": "#3b82f6",
                "coordinates": []
            })

    # Precompute per-ward metrics
    ward_stats = {}
    for w in active_ward_list:
        w_name = w["name"]
        w_id = w["id"]

        w_issues = [i for i in issues if w_name.lower() in i.ward.lower() or w["id"].lower() in i.ward.lower()]
        w_workers = [wrk for wrk in workers if w_name.lower() in wrk.primary_ward.lower()]

        total = len(w_issues)
        open_count = sum(1 for i in w_issues if i.status in ["Reported", "Acknowledged"])
        in_progress = sum(1 for i in w_issues if i.status == "In Progress")
        escalated = sum(1 for i in w_issues if i.status == "Escalated")
        resolved = sum(1 for i in w_issues if i.status == "Resolved")
        critical = sum(1 for i in w_issues if i.priority_level == "Critical" and i.status != "Resolved")

        resolved_w_issues = [i for i in w_issues if i.status == "Resolved" and i.created_at and i.updated_at]
        avg_res = round(sum((i.updated_at - i.created_at).total_seconds() / 3600.0 for i in resolved_w_issues) / len(resolved_w_issues), 1) if resolved_w_issues else 0.0

        ward_stats[w_id] = {
            "ward_id": w_id,
            "ward_name": w_name,
            "zone": w.get("zone", "Zone"),
            "color": w.get("color", "#3b82f6"),
            "total_issues": total,
            "open_issues": open_count,
            "in_progress": in_progress,
            "escalated": escalated,
            "resolved": resolved,
            "critical_issues": critical,
            "workers_assigned": len(w_workers),
            "avg_resolution_hours": avg_res,
            "workload_status": "High" if total > 3 else ("Normal" if total > 0 else "Optimal")
        }

    # Enrich GeoJSON properties
    for feature in geojson.get("features", []):
        wid = feature.get("properties", {}).get("id")
        if wid in ward_stats:
            feature["properties"].update(ward_stats[wid])

    return {
        "geojson": geojson,
        "ward_summary": list(ward_stats.values())
    }

@router.get("/ward-workload")
def get_ward_workload_distribution(db: Session = Depends(get_db)):
    """Returns ward workload balance to help identify understaffed municipal zones."""
    issues = db.query(Issue).filter(Issue.status != "Resolved").all()
    workers = db.query(Worker).filter(Worker.status == "Active").all()

    active_ward_list = list(WARD_POLYGONS)
    if not active_ward_list:
        db_wards = set()
        for i in issues:
            if i.ward and i.ward != "Ward boundary data unavailable":
                db_wards.add(i.ward)
        for w in workers:
            if w.primary_ward:
                db_wards.add(w.primary_ward)
        for idx, wname in enumerate(sorted(db_wards)):
            active_ward_list.append({
                "id": f"WARD-{idx+1:02d}",
                "name": wname,
                "zone": "Municipal Zone",
                "color": "#3b82f6",
                "coordinates": []
            })

    workload_list = []
    for w in active_ward_list:
        w_name = w["name"]
        open_count = sum(1 for i in issues if w_name.lower() in i.ward.lower())
        assigned_workers = sum(1 for wrk in workers if w_name.lower() in wrk.primary_ward.lower())
        
        ratio = round(open_count / max(1, assigned_workers), 1)
        workload_list.append({
            "ward_id": w["id"],
            "ward_name": w_name,
            "zone": w.get("zone", "Zone"),
            "open_issues": open_count,
            "workers_count": assigned_workers,
            "issue_to_worker_ratio": ratio,
            "status": "Understaffed" if ratio >= 3.0 else ("Balanced" if ratio > 0 else "Low Load")
        })

    workload_list.sort(key=lambda x: x["open_issues"], reverse=True)
    return workload_list

@router.post("/issues/{ticket_or_id}/assign")
def assign_worker(ticket_or_id: str, payload: AssignWorkerRequest, db: Session = Depends(get_db)):
    """Assigns an issue to a municipal maintenance crew."""
    issue = None
    if str(ticket_or_id).isdigit():
        issue = db.query(Issue).filter(Issue.id == int(ticket_or_id)).first()
    if not issue:
        issue = db.query(Issue).filter(Issue.ticket_id == str(ticket_or_id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    worker = db.query(Worker).filter(Worker.id == payload.worker_id).first()
    worker_name = worker.name if worker else (payload.worker_name or "Assigned Crew")
    worker_dept = worker.department if worker else (payload.department or "Roads")

    previous_worker_id = issue.assigned_worker_id
    is_reassignment = (previous_worker_id is not None and previous_worker_id != payload.worker_id)
    prev_worker_name = None

    if is_reassignment:
        prev_w = db.query(Worker).filter(Worker.id == previous_worker_id).first()
        if prev_w:
            prev_worker_name = prev_w.name
            prev_w.current_workload = max(0, (prev_w.current_workload or 1) - 1)

    now = datetime.utcnow()
    issue.assigned_worker_id = payload.worker_id
    issue.assigned_at = now
    issue.status = "ASSIGNED"
    if payload.priority:
        issue.priority_level = payload.priority
    issue.updated_at = now

    if worker:
        worker.current_workload = (worker.current_workload or 0) + 1
        worker.availability = "Working"

    action_label = "Worker Reassigned" if is_reassignment else "Worker Assigned"
    details_txt = (
        f"{action_label} to {worker_name} ({worker_dept}). "
        f"Priority: {payload.priority or issue.priority_level} | "
        f"Expected: {payload.expected_completion or 'Within 24 Hours'} | "
        f"Assigned By: {payload.assigned_by or 'Admin'}."
    )
    if is_reassignment and prev_worker_name:
        details_txt += f" (Previously assigned to {prev_worker_name})."
    if payload.instructions:
        details_txt += f" Instructions: {payload.instructions}"

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name=payload.assigned_by or "Dr. Arvind Verma (Admin)",
        actor_role="admin",
        action=action_label,
        details=details_txt,
        timestamp=now
    ))

    # Send Notification to Worker
    db.add(Notification(
        recipient_role="worker",
        title="New issue assigned",
        message=f"{issue.ticket_id} • {issue.category} • {issue.ward} • Priority: {payload.priority or issue.priority_level}",
        category="assignment",
        ticket_id=issue.ticket_id,
        is_read=False,
        created_at=now
    ))

    # Send Notification to Citizen
    db.add(Notification(
        recipient_role="citizen",
        title="Worker Assigned",
        message=f"Maintenance crew {worker_name} ({worker_dept}) has been assigned to your grievance {issue.ticket_id}.",
        category="assignment",
        ticket_id=issue.ticket_id,
        is_read=False,
        created_at=now
    ))

    db.commit()
    return {
        "success": True,
        "status": issue.status,
        "issue_id": issue.id,
        "ticket_id": issue.ticket_id,
        "assigned_worker_id": issue.assigned_worker_id,
        "worker_name": worker_name,
        "department": worker_dept,
        "ward": worker.primary_ward if worker else issue.ward,
        "priority": issue.priority_level,
        "expected_completion": payload.expected_completion or "Within 24 Hours",
        "instructions": payload.instructions,
        "is_reassignment": is_reassignment
    }

@router.post("/issues/{id}/approve-repair")
def approve_repair(id: int, payload: AdminDecisionRequest, db: Session = Depends(get_db)):
    """Admin manually reviews and overrides AI flag, approving repair as Resolved."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = "Resolved"
    issue.updated_at = datetime.utcnow()

    sub = db.query(RepairSubmission).filter(RepairSubmission.issue_id == issue.id).order_by(RepairSubmission.submitted_at.desc()).first()
    if sub:
        sub.status = "approved"

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name=payload.action_by,
        actor_role="admin",
        action="Repair Approved by Admin Override",
        details=f"Admin inspected evidence and marked ticket Resolved. Notes: {payload.admin_notes}",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    return {"success": True, "status": issue.status, "message": "Repair approved and issue marked Resolved."}

@router.post("/issues/{id}/reject-repair")
def reject_repair(id: int, payload: AdminDecisionRequest, db: Session = Depends(get_db)):
    """Admin confirms AI suspicious detection and rejects repair evidence."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = "In Progress"
    issue.updated_at = datetime.utcnow()

    sub = db.query(RepairSubmission).filter(RepairSubmission.issue_id == issue.id).order_by(RepairSubmission.submitted_at.desc()).first()
    if sub:
        sub.status = "rejected"

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name=payload.action_by,
        actor_role="admin",
        action="Repair Evidence Rejected",
        details=f"Admin confirmed fake/inadequate fix. Work crew ordered to redo repair. Notes: {payload.admin_notes}",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    return {"success": True, "status": issue.status, "message": "Repair rejected. Status reset to In Progress."}

@router.post("/issues/{id}/reopen")
def reopen_issue(id: int, payload: AdminDecisionRequest, db: Session = Depends(get_db)):
    """Reopens an issue."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = "In Progress"
    issue.updated_at = datetime.utcnow()

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name=payload.action_by,
        actor_role="admin",
        action="Ticket Reopened",
        details=f"Ticket reopened by municipal authority. Reason: {payload.admin_notes}",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    return {"success": True, "status": issue.status}

@router.post("/issues/{id}/escalate")
def admin_escalate(id: int, db: Session = Depends(get_db)):
    """Admin manual trigger for immediate escalation."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    esc = trigger_issue_escalation(
        db,
        issue,
        level=issue.escalation_level + 1,
        manual=True,
        actor_name="Municipal Admin",
        actor_role="admin"
    )
    return {"success": True, "status": issue.status, "escalation_level": issue.escalation_level}

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    """Fetches system-wide administrative audit trail."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "issue_id": l.issue_id,
            "ticket_id": l.issue.ticket_id if l.issue else None,
            "actor_name": l.actor_name,
            "actor_role": l.actor_role,
            "action": l.action,
            "details": l.details,
            "timestamp": l.timestamp.isoformat()
        } for l in logs
    ]
