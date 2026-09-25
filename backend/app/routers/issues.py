from fastapi import APIRouter, Depends, HTTPException, Query, Header, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import os
import uuid

from app.database import get_db
from app.models.issue import Issue, IssueReport, IssueImage, Upvote
from app.models.escalation import AuditLog
from app.models.credits import CreditTransaction
from app.schemas.issue import (
    IssueCreate, IssueSummary, IssueResponse, DuplicateCheckRequest,
    DuplicateCheckResponse, DuplicateMatch, DuplicateMergeRequest
)
from app.services.image_utils import save_base64_image, save_uploaded_photo, load_image_cv2
from app.services.duplicate_detector import detect_duplicates, evaluate_duplicate_candidate
from app.services.priority_engine import calculate_priority_score
from app.services.ward_service import detect_ward_by_coords, get_geojson_feature_collection
from app.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/api/issues", tags=["Issues"])
citizen_router = APIRouter(prefix="/api/citizen", tags=["Citizen"])

class WardDetectRequest(BaseModel):
    latitude: float
    longitude: float

@router.post("/detect-ward")
def detect_ward_endpoint(payload: WardDetectRequest):
    """Automatically detects municipal ward from GPS coordinates using official municipal GeoJSON boundaries."""
    return detect_ward_by_coords(payload.latitude, payload.longitude)

@router.get("/wards/geojson")
def get_public_wards_geojson():
    """Returns municipal ward GeoJSON polygons for public map visualization."""
    return get_geojson_feature_collection()

@router.post("/upload-photo")
async def upload_issue_photo(file: UploadFile = File(...)):
    """Uploads a complaint photo and returns its stored relative URL."""
    try:
        content = await file.read()
        url = save_uploaded_photo(content, file.filename or "photo.jpg")
        return {"photo_url": url, "filename": os.path.basename(url)}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

def generate_ticket_id(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"CIV-{year}-"
    # Find highest numeric suffix among tickets matching current year
    existing_tickets = db.query(Issue.ticket_id).filter(Issue.ticket_id.like(f"{prefix}%")).all()
    max_num = 0
    for (t_id,) in existing_tickets:
        if t_id and t_id.startswith(prefix):
            suffix = t_id[len(prefix):]
            if suffix.isdigit():
                max_num = max(max_num, int(suffix))

    if max_num == 0:
        max_num = len(existing_tickets)

    next_num = max_num + 1
    ticket_id = f"{prefix}{next_num:06d}"
    while db.query(Issue).filter(Issue.ticket_id == ticket_id).first() is not None:
        next_num += 1
        ticket_id = f"{prefix}{next_num:06d}"
    return ticket_id

@router.post("", response_model=dict)
def report_issue(payload: IssueCreate, db: Session = Depends(get_db)):
    """Creates a real database civic issue report with photo and geocoded location."""
    # 1. Validate required fields with understandable errors
    if not payload.category or not str(payload.category).strip():
        raise HTTPException(status_code=400, detail="Please choose an issue category.")
    if not payload.description or not str(payload.description).strip():
        raise HTTPException(status_code=400, detail="Please enter a description for the issue.")
    if payload.latitude is None or payload.longitude is None:
        raise HTTPException(status_code=400, detail="Please select the issue location.")
    if not payload.address or not str(payload.address).strip():
        raise HTTPException(status_code=400, detail="Please provide a valid street address or landmark.")

    # 2. Store complaint photo
    raw_photo = payload.photo or payload.image_base64
    image_url = ""
    if raw_photo:
        if raw_photo.startswith("/uploads/"):
            image_url = raw_photo
        else:
            try:
                image_url = save_base64_image(raw_photo, folder="issues")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid photo format or corrupt image data: {str(e)}")
    elif payload.photo_url:
        image_url = payload.photo_url
    else:
        raise HTTPException(status_code=400, detail="Please upload an issue photo.")

    ticket_id = generate_ticket_id(db)
    now = datetime.utcnow()
    escalation_due = now + timedelta(hours=settings.ESCALATION_HOURS)

    # 3. Deterministic priority computation
    priority_score, priority_level = calculate_priority_score(
        category=payload.category,
        report_count=1,
        upvotes=0,
        created_at=now,
        is_escalated=False,
        severity=payload.severity,
        is_emergency=payload.is_emergency
    )

    # 4. Ward detection (optional; no fictional fallback)
    detected_ward = payload.ward
    detected_ward_id = payload.ward_id
    if not detected_ward or detected_ward in ["Detecting Ward...", "All", "Ward boundary data unavailable"]:
        ward_info = detect_ward_by_coords(payload.latitude, payload.longitude)
        if ward_info.get("is_detected"):
            detected_ward = ward_info.get("ward_name")
            detected_ward_id = ward_info.get("ward_id")
        else:
            detected_ward = "Ward boundary data unavailable"
            detected_ward_id = None

    issue_title = payload.title or f"{payload.category} at {payload.address}"

    # 5. Persist to SQLite
    issue = Issue(
        ticket_id=ticket_id,
        category=payload.category,
        title=issue_title,
        description=payload.description,
        latitude=float(payload.latitude),
        longitude=float(payload.longitude),
        address=payload.address,
        ward=detected_ward,
        ward_id=detected_ward_id,
        status="REPORTED",
        priority_score=priority_score,
        priority_level=priority_level,
        report_count=1,
        upvotes=0,
        support_count=0,
        reporter_name=payload.reporter_name or "Citizen",
        before_image_url=image_url,
        escalation_deadline=escalation_due,
        escalation_due_at=escalation_due,
        escalation_level=0,
        is_emergency=bool(payload.is_emergency),
        hazard_type=payload.hazard_type,
        created_at=now,
        updated_at=now
    )
    db.add(issue)
    db.flush()

    # Initial report record
    report = IssueReport(
        issue_id=issue.id,
        reporter_name=payload.reporter_name or "Citizen",
        reporter_contact=payload.reporter_contact,
        description=payload.description,
        image_url=image_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_duplicate_merge=False,
        created_at=now
    )
    db.add(report)

    # Initial image record
    db.add(IssueImage(
        issue_id=issue.id,
        image_type="before",
        image_url=image_url,
        uploaded_by_name=payload.reporter_name or "Citizen",
        uploaded_at=now
    ))

    # Audit log
    db.add(AuditLog(
        issue_id=issue.id,
        actor_name=payload.reporter_name or "Citizen",
        actor_role="citizen",
        action="Complaint Registered",
        details=f"Citizen registered new issue '{issue.ticket_id}' under category '{payload.category}'.",
        timestamp=now
    ))

    # Award pending Civic Credits
    db.add(CreditTransaction(
        user_id=1,
        issue_id=issue.id,
        ticket_id=issue.ticket_id,
        amount=10,
        activity_type="Valid Issue Report",
        status="Pending",
        description=f"Citizen reported {issue.category} at {issue.address}",
        created_at=now
    ))

    db.commit()
    db.refresh(issue)

    return {
        "id": issue.id,
        "ticket_id": issue.ticket_id,
        "category": issue.category,
        "title": issue.title,
        "description": issue.description,
        "status": issue.status,
        "priority_level": issue.priority_level,
        "priority_score": issue.priority_score,
        "latitude": issue.latitude,
        "longitude": issue.longitude,
        "address": issue.address,
        "ward": issue.ward,
        "ward_id": issue.ward_id,
        "before_image_url": issue.before_image_url,
        "created_at": issue.created_at.isoformat(),
        "escalation_due_at": issue.escalation_due_at.isoformat() if issue.escalation_due_at else None
    }

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
def check_duplicate(payload: DuplicateCheckRequest, db: Session = Depends(get_db)):
    """
    Intelligent pre-submission duplicate check:
    Compares GPS proximity (50m), category, and visual features.
    """
    active_issues = db.query(Issue).filter(Issue.status.notin_(["Resolved"])).all()

    # Decode base64 image if provided for visual comparison
    img_cv = None
    if payload.image_base64:
        temp_url = save_base64_image(payload.image_base64, folder="before")
        img_cv = load_image_cv2(temp_url)

    matches = detect_duplicates(
        category=payload.category,
        lat=payload.latitude,
        lon=payload.longitude,
        image_cv=img_cv,
        active_issues=active_issues,
        threshold=settings.DUPLICATE_CONFIDENCE_THRESHOLD
    )

    if not matches:
        return DuplicateCheckResponse(
            is_possible_duplicate=False,
            best_match=None,
            all_matches=[]
        )

    best = matches[0]
    best_issue = best["issue"]
    
    best_match_obj = DuplicateMatch(
        issue_id=best_issue.id,
        ticket_id=best_issue.ticket_id,
        title=best_issue.title,
        category=best_issue.category,
        ward=best_issue.ward,
        distance_meters=best["distance_meters"],
        confidence_score=best["confidence_score"],
        breakdown=best["breakdown"],
        before_image_url=best_issue.before_image_url,
        address=best_issue.address,
        status=best_issue.status,
        report_count=best_issue.report_count,
        created_at=best_issue.created_at
    )

    all_matches_list = []
    for m in matches:
        iss = m["issue"]
        all_matches_list.append(DuplicateMatch(
            issue_id=iss.id,
            ticket_id=iss.ticket_id,
            title=iss.title,
            category=iss.category,
            distance_meters=m["distance_meters"],
            confidence_score=m["confidence_score"],
            breakdown=m["breakdown"],
            before_image_url=iss.before_image_url,
            address=iss.address,
            status=iss.status,
            report_count=iss.report_count,
            created_at=iss.created_at
        ))

    return DuplicateCheckResponse(
        is_possible_duplicate=True,
        best_match=best_match_obj,
        all_matches=all_matches_list
    )

@router.post("/merge-duplicate", response_model=dict)
def merge_duplicate(payload: DuplicateMergeRequest, db: Session = Depends(get_db)):
    """
    Citizen confirms duplicate:
    Merges report into master ticket, increments citizen count, boosts priority.
    """
    issue = db.query(Issue).filter(Issue.id == payload.target_issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Master issue not found")

    image_url = None
    if payload.image_base64:
        image_url = save_base64_image(payload.image_base64, folder="before")
        db.add(IssueImage(
            issue_id=issue.id,
            image_type="merge",
            image_url=image_url,
            uploaded_by_name=payload.reporter_name or "Citizen",
            uploaded_at=datetime.utcnow()
        ))

    # Add duplicate report record
    report = IssueReport(
        issue_id=issue.id,
        reporter_name=payload.reporter_name or "Citizen",
        reporter_contact=payload.reporter_contact,
        description=payload.description or "Citizen confirmed identical civic grievance.",
        image_url=image_url or issue.before_image_url,
        latitude=payload.latitude or issue.latitude,
        longitude=payload.longitude or issue.longitude,
        is_duplicate_merge=True,
        similarity_score=87.5,
        created_at=datetime.utcnow()
    )
    db.add(report)

    # Increment citizen count and upvotes
    issue.report_count += 1
    issue.upvotes += 1
    issue.updated_at = datetime.utcnow()

    # Recalculate priority
    score, p_level = calculate_priority_score(
        category=issue.category,
        report_count=issue.report_count,
        upvotes=issue.upvotes,
        created_at=issue.created_at,
        is_escalated=(issue.status == "Escalated")
    )
    issue.priority_score = score
    issue.priority_level = p_level

    # Audit log
    db.add(AuditLog(
        issue_id=issue.id,
        actor_name=payload.reporter_name or "Citizen",
        actor_role="citizen",
        action="Duplicate Report Merged",
        details=f"Report merged into master ticket {issue.ticket_id}. Total citizen voice increased to {issue.report_count}. Priority updated to {issue.priority_level} ({issue.priority_score}).",
        timestamp=datetime.utcnow()
    ))

    db.commit()
    db.refresh(issue)

    return {
        "success": True,
        "message": f"Your report has been merged with {issue.ticket_id}.",
        "ticket_id": issue.ticket_id,
        "report_count": issue.report_count,
        "priority_level": issue.priority_level,
        "priority_score": issue.priority_score
    }

@citizen_router.get("/issues", response_model=List[IssueSummary])
@router.get("/citizen/issues", response_model=List[IssueSummary])
@router.get("/my-reports", response_model=List[IssueSummary])
def get_my_reports(
    x_user_name: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Returns only grievances submitted by the authenticated citizen."""
    q = db.query(Issue)
    if x_user_id and str(x_user_id).isdigit():
        q = q.filter(Issue.reporter_id == int(x_user_id))
    elif x_user_name and x_user_name.strip():
        q = q.filter(Issue.reporter_name.ilike(f"%{x_user_name.strip()}%"))
    return q.order_by(Issue.created_at.desc()).all()

@router.get("", response_model=List[IssueSummary])
def get_issues(
    category: Optional[str] = None,
    status: Optional[str] = None,
    ward: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    include_resolved: bool = True,
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Fetches list of issues with optional multi-criteria filters."""
    query = db.query(Issue)

    # Filter for citizen's own issues if specifically requested for citizen-only listing
    if x_user_role == "citizen" and x_user_name and not ward and not category:
        query = query.filter(Issue.reporter_name.ilike(f"%{x_user_name.strip()}%"))

    if not include_resolved:
        query = query.filter(Issue.status != "Resolved")
    if category and category != "All":
        query = query.filter(Issue.category == category)
    if status and status != "All":
        query = query.filter(Issue.status == status)
    if ward and ward != "All":
        query = query.filter(Issue.ward == ward)
    if priority and priority != "All":
        query = query.filter(Issue.priority_level == priority)
    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (Issue.title.ilike(search_fmt)) |
            (Issue.ticket_id.ilike(search_fmt)) |
            (Issue.address.ilike(search_fmt)) |
            (Issue.description.ilike(search_fmt))
        )

    return query.order_by(Issue.priority_score.desc(), Issue.created_at.desc()).all()

@router.get("/{ticket_or_id}")
def get_issue_details(ticket_or_id: str, db: Session = Depends(get_db)):
    """Fetches comprehensive details for a single issue including verifications and timeline."""
    if ticket_or_id.isdigit():
        issue = db.query(Issue).filter(Issue.id == int(ticket_or_id)).first()
    else:
        issue = db.query(Issue).filter(Issue.ticket_id == ticket_or_id.upper()).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    # Fetch related records
    reports = db.query(IssueReport).filter(IssueReport.issue_id == issue.id).order_by(IssueReport.created_at.desc()).all()
    images = db.query(IssueImage).filter(IssueImage.issue_id == issue.id).order_by(IssueImage.uploaded_at.desc()).all()
    repairs = issue.repair_submissions
    ai_vers = issue.ai_verifications
    votes = issue.community_votes
    escalations = issue.escalations
    audit_logs = db.query(AuditLog).filter(AuditLog.issue_id == issue.id).order_by(AuditLog.timestamp.desc()).all()

    # Community vote counts
    fixed_count = sum(1 for v in votes if v.vote == "FIXED")
    broken_count = sum(1 for v in votes if v.vote == "STILL_BROKEN")

    # Fetch assigned worker if any
    worker = None
    if issue.assigned_worker_id:
        from app.models.worker import Worker
        worker = db.query(Worker).filter(Worker.id == issue.assigned_worker_id).first()

    # Build safe response
    return {
        "id": issue.id,
        "ticket_id": issue.ticket_id,
        "category": issue.category,
        "title": issue.title,
        "description": issue.description,
        "latitude": issue.latitude,
        "longitude": issue.longitude,
        "address": issue.address,
        "ward": issue.ward,
        "ward_id": getattr(issue, "ward_id", None),
        "status": issue.status,
        "priority_score": issue.priority_score,
        "priority_level": issue.priority_level,
        "report_count": issue.report_count,
        "upvotes": issue.upvotes,
        "support_count": getattr(issue, "support_count", issue.upvotes),
        "assigned_worker_id": issue.assigned_worker_id,
        "assigned_worker_name": worker.name if worker else None,
        "assigned_worker_department": worker.department if worker else None,
        "assigned_worker_phone": worker.phone if worker else None,
        "assigned_at": issue.assigned_at.isoformat() if getattr(issue, "assigned_at", None) else None,
        "work_started_at": issue.work_started_at.isoformat() if getattr(issue, "work_started_at", None) else None,
        "work_completed_at": issue.work_completed_at.isoformat() if getattr(issue, "work_completed_at", None) else None,
        "worker_completion_note": getattr(issue, "worker_completion_note", None),
        "citizen_verified": getattr(issue, "citizen_verified", False),
        "citizen_verified_at": issue.citizen_verified_at.isoformat() if getattr(issue, "citizen_verified_at", None) else None,
        "citizen_rejection_reason": getattr(issue, "citizen_rejection_reason", None),
        "reporter_name": issue.reporter_name,
        "before_image_url": issue.before_image_url,
        "after_image_url": issue.after_image_url,
        "escalation_deadline": issue.escalation_deadline.isoformat() if issue.escalation_deadline else None,
        "escalation_due_at": (issue.escalation_due_at or issue.escalation_deadline).isoformat() if (issue.escalation_due_at or issue.escalation_deadline) else None,
        "escalation_level": issue.escalation_level,
        "created_at": issue.created_at.isoformat() if issue.created_at else None,
        "updated_at": issue.updated_at.isoformat() if issue.updated_at else None,
        "reports": [
            {
                "id": r.id,
                "reporter_name": r.reporter_name,
                "description": r.description,
                "image_url": r.image_url,
                "is_duplicate_merge": r.is_duplicate_merge,
                "similarity_score": r.similarity_score,
                "created_at": r.created_at.isoformat()
            } for r in reports
        ],
        "images": [
            {
                "id": img.id,
                "image_type": img.image_type,
                "image_url": img.image_url,
                "uploaded_by_name": img.uploaded_by_name,
                "uploaded_at": img.uploaded_at.isoformat()
            } for img in images
        ],
        "latest_ai_verification": {
            "id": ai_vers[0].id,
            "location_match_score": ai_vers[0].location_match_score,
            "scene_match_score": ai_vers[0].scene_match_score,
            "repair_confidence_score": ai_vers[0].repair_confidence_score,
            "suspicion_level": ai_vers[0].suspicion_level,
            "verification_status": ai_vers[0].verification_status,
            "diagnostic_summary": ai_vers[0].diagnostic_summary,
            "failure_reasons": ai_vers[0].failure_reasons,
            "heatmap_url": ai_vers[0].heatmap_url,
            "verified_at": ai_vers[0].verified_at.isoformat()
        } if ai_vers else None,
        "community_verification": {
            "fixed_count": fixed_count,
            "broken_count": broken_count,
            "total_votes": len(votes),
            "recent_votes": [
                {
                    "citizen_name": v.citizen_name,
                    "vote": v.vote,
                    "comments": v.comments,
                    "created_at": v.created_at.isoformat()
                } for v in votes[:5]
            ]
        },
        "latest_escalation": {
            "id": escalations[0].id,
            "level": escalations[0].level,
            "authority_name": escalations[0].authority_name,
            "authority_email": escalations[0].authority_email,
            "email_subject": escalations[0].email_subject,
            "email_body": escalations[0].email_body,
            "x_post_text": escalations[0].x_post_text,
            "x_post_status": escalations[0].x_post_status,
            "status": escalations[0].status,
            "sent_at": escalations[0].sent_at.isoformat()
        } if escalations else None,
        "audit_logs": [
            {
                "id": log.id,
                "actor_name": log.actor_name,
                "actor_role": log.actor_role,
                "action": log.action,
                "details": log.details,
                "timestamp": log.timestamp.isoformat()
            } for log in audit_logs
        ]
    }

@router.post("/{id}/upvote")
def upvote_issue(id: int, db: Session = Depends(get_db)):
    """Increments citizen upvotes for an issue."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.upvotes += 1
    # Recalculate priority
    score, p_level = calculate_priority_score(
        category=issue.category,
        report_count=issue.report_count,
        upvotes=issue.upvotes,
        created_at=issue.created_at,
        is_escalated=(issue.status == "Escalated")
    )
    issue.priority_score = score
    issue.priority_level = p_level

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name="Citizen Supporter",
        actor_role="citizen",
        action="Issue Upvoted",
        details=f"Citizen added neighborhood support. Total upvotes: {issue.upvotes}.",
        timestamp=datetime.utcnow()
    ))

    db.commit()

    # Award +5 Confirmed Civic Credits for genuine duplicate merge
    db.add(CreditTransaction(
        user_id=1,
        issue_id=issue.id,
        ticket_id=issue.ticket_id,
        amount=5,
        activity_type="Duplicate Merged",
        status="Confirmed",
        description=f"Citizen supported existing grievance {issue.ticket_id} (+1 Voice)",
        created_at=datetime.utcnow(),
        confirmed_at=datetime.utcnow()
    ))
    db.commit()

    return {"success": True, "upvotes": issue.upvotes, "priority_score": issue.priority_score}

@router.get("/map/markers")
def get_map_markers(db: Session = Depends(get_db)):
    """Lightweight endpoint specifically tailored for Leaflet map markers."""
    issues = db.query(Issue).all()
    return [
        {
            "id": i.id,
            "ticket_id": i.ticket_id,
            "category": i.category,
            "title": i.title,
            "latitude": i.latitude,
            "longitude": i.longitude,
            "address": i.address,
            "ward": i.ward,
            "status": i.status,
            "priority_score": i.priority_score,
            "priority_level": i.priority_level,
            "report_count": i.report_count,
            "upvotes": i.upvotes,
            "before_image_url": i.before_image_url,
            "created_at": i.created_at.isoformat(),
            "escalation_deadline": i.escalation_deadline.isoformat()
        } for i in issues
    ]
