from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db, Base, engine
from app.models.issue import Issue
from app.services.demo_seed import seed_demo_database
from app.services.escalation_engine import trigger_issue_escalation
from app.routers.repairs import submit_repair_evidence, RepairSubmitRequest

router = APIRouter(prefix="/api/demo", tags=["Demo Controls"])

@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """Resets and reseeds clean demo database."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_demo_database(db)
    return {"success": True, "message": "Demo database successfully reset and seeded."}

@router.post("/fast-forward-timer/{ticket_id}")
def fast_forward_timer(ticket_id: str, db: Session = Depends(get_db)):
    """
    Accelerates 48-hour escalation timer to 0:
    Triggers automated Level 1 municipal email & public X post escalation!
    """
    issue = db.query(Issue).filter(Issue.ticket_id == ticket_id.upper()).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Set deadline in the past
    issue.escalation_deadline = datetime.utcnow() - timedelta(minutes=1)
    
    # Trigger escalation
    esc = trigger_issue_escalation(
        db,
        issue,
        level=1,
        manual=False,
        actor_name="Automated Escalation Daemon (Demo Acceleration)",
        actor_role="system"
    )

    return {
        "success": True,
        "message": f"Timer expired! Escalation executed for {ticket_id}.",
        "new_status": issue.status,
        "escalation_level": issue.escalation_level,
        "email_subject": esc.email_subject,
        "x_post_text": esc.x_post_text
    }

@router.post("/simulate-fake-fix/{ticket_id}")
def simulate_fake_fix(ticket_id: str, db: Session = Depends(get_db)):
    """
    Simulates municipal worker uploading an indoor/mismatched photo for a road issue.
    Demonstrates OpenCV AI flagging 'Suspicious Repair Evidence'.
    """
    issue = db.query(Issue).filter(Issue.ticket_id == ticket_id.upper()).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Indoor tile floor image
    indoor_image_url = "/uploads/after/fake_office_after.jpg"
    
    # Run repair logic directly with synthetic image
    from app.models.verification import RepairSubmission, AiVerification
    from app.services.repair_verifier import verify_repair_cv
    from app.models.escalation import AuditLog
    import json

    issue.after_image_url = indoor_image_url
    issue.updated_at = datetime.utcnow()

    sub = RepairSubmission(
        issue_id=issue.id,
        worker_name="Rajesh Kumar (Road Crew)",
        repair_notes="Asphalt patch completed with cold-mix bitumen.",
        materials_used="Bitumen emulsion, aggregates",
        after_image_url=indoor_image_url,
        status="disputed",
        submitted_at=datetime.utcnow()
    )
    db.add(sub)
    db.flush()

    cv_res = verify_repair_cv(issue.before_image_url, indoor_image_url)

    ai_ver = AiVerification(
        issue_id=issue.id,
        repair_submission_id=sub.id,
        location_match_score=cv_res["location_match_score"],
        scene_match_score=cv_res["scene_match_score"],
        repair_confidence_score=cv_res["repair_confidence_score"],
        suspicion_level=cv_res["suspicion_level"],
        verification_status=cv_res["verification_status"],
        diagnostic_summary=cv_res["diagnostic_summary"],
        failure_reasons=json.dumps(cv_res["failure_reasons"]),
        heatmap_url=cv_res["heatmap_url"],
        verified_at=datetime.utcnow()
    )
    db.add(ai_ver)

    issue.status = "Disputed"

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name="Rajesh Kumar",
        actor_role="worker",
        action="Repair Submitted (Worker)",
        details="Worker Rajesh submitted repair photo.",
        timestamp=datetime.utcnow()
    ))
    db.add(AuditLog(
        issue_id=issue.id,
        actor_name="CivicEye AI Fake-Fix Detector",
        actor_role="system",
        action="AI Flagged: Suspicious Repair Evidence",
        details=f"RANSAC Scene Match {cv_res['scene_match_score']}%. Background mismatch detected. Status set to Disputed.",
        timestamp=datetime.utcnow()
    ))

    db.commit()

    return {
        "success": True,
        "message": "Fake fix submitted and successfully flagged by AI!",
        "new_status": issue.status,
        "ai_result": cv_res
    }

@router.post("/simulate-real-fix/{ticket_id}")
def simulate_real_fix(ticket_id: str, db: Session = Depends(get_db)):
    """
    Simulates genuine asphalt repair photo, which passes AI and moves to Community Verification.
    """
    issue = db.query(Issue).filter(Issue.ticket_id == ticket_id.upper()).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Ticket not found")

    real_image_url = "/uploads/after/pothole_repaired_after.jpg"

    from app.models.verification import RepairSubmission, AiVerification
    from app.services.repair_verifier import verify_repair_cv
    from app.models.escalation import AuditLog
    import json

    issue.after_image_url = real_image_url
    issue.updated_at = datetime.utcnow()

    sub = RepairSubmission(
        issue_id=issue.id,
        worker_name="Rajesh Kumar (Road Crew)",
        repair_notes="Genuine asphalt repair executed with hot-mix asphalt and heavy roller compaction.",
        materials_used="Hot-mix asphalt VG-30, crushed aggregate stone",
        after_image_url=real_image_url,
        status="pending_community",
        submitted_at=datetime.utcnow()
    )
    db.add(sub)
    db.flush()

    cv_res = verify_repair_cv(issue.before_image_url, real_image_url)

    ai_ver = AiVerification(
        issue_id=issue.id,
        repair_submission_id=sub.id,
        location_match_score=cv_res["location_match_score"],
        scene_match_score=cv_res["scene_match_score"],
        repair_confidence_score=cv_res["repair_confidence_score"],
        suspicion_level=cv_res["suspicion_level"],
        verification_status=cv_res["verification_status"],
        diagnostic_summary=cv_res["diagnostic_summary"],
        failure_reasons=json.dumps(cv_res["failure_reasons"]),
        heatmap_url=cv_res["heatmap_url"],
        verified_at=datetime.utcnow()
    )
    db.add(ai_ver)

    issue.status = "Community Verification"

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name="Rajesh Kumar",
        actor_role="worker",
        action="Genuine Repair Submitted",
        details="Repair completed per standard specs.",
        timestamp=datetime.utcnow()
    ))
    db.add(AuditLog(
        issue_id=issue.id,
        actor_name="CivicEye AI Verifier",
        actor_role="system",
        action="AI Passed: Qualified for Community Verification",
        details=f"Scene Match {cv_res['scene_match_score']}%, Repair Confidence {cv_res['repair_confidence_score']}%. Forwarded to neighborhood verification.",
        timestamp=datetime.utcnow()
    ))

    db.commit()

    return {
        "success": True,
        "message": "Genuine fix submitted and verified by AI. Status updated to Community Verification!",
        "new_status": issue.status,
        "ai_result": cv_res
    }
