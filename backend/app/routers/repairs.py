from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import json

from app.database import get_db
from app.models.issue import Issue, IssueImage
from app.models.verification import RepairSubmission, AiVerification, CommunityVerification
from app.models.escalation import AuditLog
from app.models.emergency import Notification
from app.models.credits import CreditTransaction
from app.schemas.verification import RepairSubmitRequest, CommunityVoteRequest, CitizenVerifyRequest
from app.services.image_utils import save_base64_image
from app.services.repair_verifier import verify_repair_cv

router = APIRouter(prefix="/api/issues", tags=["Repairs & Verifications"])

@router.post("/{id}/repair", response_model=dict)
def submit_repair_evidence(
    id: int,
    payload: RepairSubmitRequest,
    x_worker_id: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Municipal worker submits repair completion evidence.
    Worker CANNOT directly mark a ticket as Resolved.
    Triggers OpenCV AI Fake-Fix Detector and sets status to AWAITING_CITIZEN_VERIFICATION.
    """
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Security check: Worker can only submit repair for their assigned issue
    if x_user_role == "worker" and x_worker_id and str(x_worker_id).isdigit():
        wid = int(x_worker_id)
        if issue.assigned_worker_id and issue.assigned_worker_id != wid:
            raise HTTPException(status_code=403, detail="403 Forbidden: You are not assigned to this issue.")

    now = datetime.utcnow()

    # Save After Photo
    after_url = save_base64_image(payload.after_image_base64, folder="after")
    issue.after_image_url = after_url
    issue.work_completed_at = now
    issue.worker_completion_note = payload.repair_notes
    issue.status = "AWAITING_CITIZEN_VERIFICATION"
    issue.updated_at = now

    # Save to IssueImage
    db.add(IssueImage(
        issue_id=issue.id,
        image_type="after",
        image_url=after_url,
        uploaded_by_name=payload.worker_name or "Municipal Crew",
        uploaded_at=now
    ))

    # Save Repair Submission
    submission = RepairSubmission(
        issue_id=issue.id,
        worker_name=payload.worker_name or "Municipal Road Crew",
        repair_notes=payload.repair_notes,
        materials_used=payload.materials_used,
        after_image_url=after_url,
        status="awaiting_citizen_verification",
        submitted_at=now
    )
    db.add(submission)
    db.flush()

    # Run OpenCV Computer Vision "Fake Fix" Detector
    cv_result = verify_repair_cv(issue.before_image_url, after_url)

    # Save AI Verification
    ai_ver = AiVerification(
        issue_id=issue.id,
        repair_submission_id=submission.id,
        location_match_score=cv_result["location_match_score"],
        scene_match_score=cv_result["scene_match_score"],
        repair_confidence_score=cv_result["repair_confidence_score"],
        suspicion_level=cv_result["suspicion_level"],
        verification_status=cv_result["verification_status"],
        diagnostic_summary=cv_result["diagnostic_summary"],
        failure_reasons=json.dumps(cv_result["failure_reasons"]),
        heatmap_url=cv_result["heatmap_url"],
        verified_at=now
    )
    db.add(ai_ver)

    log_action = "Work Completed by Worker (Awaiting Citizen Verification)"
    log_detail = (
        f"Worker submitted repair completion evidence with notes: '{payload.repair_notes}'. "
        f"AI CV Analysis: Scene Match {cv_result['scene_match_score']}%, "
        f"Suspicion Level: {cv_result['suspicion_level']}. Ticket routed to Awaiting Citizen Verification."
    )

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name=payload.worker_name or "Municipal Crew",
        actor_role="worker",
        action=log_action,
        details=log_detail,
        timestamp=now
    ))

    # Send Notification to Citizen: "Worker has marked CIV-XXXX as completed. Please verify whether the issue has been fixed."
    db.add(Notification(
        recipient_role="citizen",
        title="Repair Completed — Verification Required",
        message=f"Worker has marked {issue.ticket_id} as completed. Please verify whether the issue has been fixed.",
        category="verification",
        ticket_id=issue.ticket_id,
        is_read=False,
        created_at=now
    ))

    db.commit()

    return {
        "success": True,
        "new_status": issue.status,
        "ai_result": {
            "location_match_score": cv_result["location_match_score"],
            "scene_match_score": cv_result["scene_match_score"],
            "repair_confidence_score": cv_result["repair_confidence_score"],
            "suspicion_level": cv_result["suspicion_level"],
            "verification_status": cv_result["verification_status"],
            "diagnostic_summary": cv_result["diagnostic_summary"],
            "heatmap_url": cv_result["heatmap_url"]
        }
    }

@router.post("/{id}/citizen-verify", response_model=dict)
def citizen_verify_repair(
    id: int,
    payload: CitizenVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Original citizen verifies physical repair status:
    - YES: issue marked RESOLVED, citizen awarded Civic Credits, Admin & Worker notified.
    - NO: issue marked REOPENED, reason recorded, Admin & Worker notified.
    """
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    now = datetime.utcnow()
    if payload.verified:
        issue.citizen_verified = True
        issue.citizen_verified_at = now
        issue.status = "RESOLVED"
        issue.updated_at = now

        db.add(AuditLog(
            issue_id=issue.id,
            actor_name=payload.citizen_name or issue.reporter_name or "Citizen",
            actor_role="citizen",
            action="Citizen Verified Fixed",
            details="Original reporting citizen verified that the defect has been successfully repaired on site.",
            timestamp=now
        ))

        db.add(Notification(
            recipient_role="worker",
            title="Work Verified by Citizen",
            message=f"Citizen confirmed resolution for {issue.ticket_id}. Great job!",
            category="resolution",
            ticket_id=issue.ticket_id,
            is_read=False,
            created_at=now
        ))

        db.add(Notification(
            recipient_role="admin",
            title="Issue Resolved & Verified",
            message=f"Ticket {issue.ticket_id} has been verified by the reporting citizen and officially marked Resolved.",
            category="resolution",
            ticket_id=issue.ticket_id,
            is_read=False,
            created_at=now
        ))

        # Award Civic Credits
        db.add(CreditTransaction(
            user_id=issue.reporter_id or 1,
            issue_id=issue.id,
            ticket_id=issue.ticket_id,
            amount=10,
            activity_type="Resolution Bonus",
            status="Confirmed",
            description=f"Verified resolution for complaint {issue.ticket_id}",
            created_at=now,
            confirmed_at=now
        ))

        db.commit()
        return {
            "success": True,
            "status": issue.status,
            "citizen_verified": True,
            "message": "Issue verified as fixed! Thank you for keeping our city safe."
        }
    else:
        issue.citizen_verified = False
        issue.citizen_rejection_reason = payload.reason or "Citizen reported issue still exists."
        issue.status = "REOPENED"
        issue.updated_at = now

        db.add(AuditLog(
            issue_id=issue.id,
            actor_name=payload.citizen_name or issue.reporter_name or "Citizen",
            actor_role="citizen",
            action="Citizen Rejected Repair (Reopened)",
            details=f"Citizen reported defect still exists on site: {payload.reason or 'No additional details'}.",
            timestamp=now
        ))

        db.add(Notification(
            recipient_role="worker",
            title="Repair Rejected by Citizen",
            message=f"Citizen reported that {issue.ticket_id} is still broken. Reason: {payload.reason or 'Defect still visible'}.",
            category="dispute",
            ticket_id=issue.ticket_id,
            is_read=False,
            created_at=now
        ))

        db.add(Notification(
            recipient_role="admin",
            title="Repair Disputed / Reopened",
            message=f"Citizen rejected repair for {issue.ticket_id}. Status moved to Reopened for review.",
            category="dispute",
            ticket_id=issue.ticket_id,
            is_read=False,
            created_at=now
        ))

        db.commit()
        return {
            "success": True,
            "status": issue.status,
            "citizen_verified": False,
            "message": "Repair rejected. Issue reopened and forwarded to municipal authorities for review."
        }

@router.post("/{id}/community-vote", response_model=dict)
def submit_community_vote(
    id: int,
    payload: CommunityVoteRequest,
    db: Session = Depends(get_db)
):
    """
    Citizens vote YES (Fixed) or NO (Still Broken) on ground-truth repair status.
    """
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    evidence_url = None
    if payload.evidence_image_base64:
        evidence_url = save_base64_image(payload.evidence_image_base64, folder="before")
        db.add(IssueImage(
            issue_id=issue.id,
            image_type="community",
            image_url=evidence_url,
            uploaded_by_name=payload.citizen_name or "Community Verifier",
            uploaded_at=datetime.utcnow()
        ))

    vote_record = CommunityVerification(
        issue_id=issue.id,
        citizen_name=payload.citizen_name or "Neighborhood Citizen",
        vote=payload.vote.upper(),
        comments=payload.comments,
        evidence_image_url=evidence_url,
        created_at=datetime.utcnow()
    )
    db.add(vote_record)
    db.flush()

    # Re-evaluate all votes for this issue
    all_votes = db.query(CommunityVerification).filter(CommunityVerification.issue_id == issue.id).all()
    fixed_count = sum(1 for v in all_votes if v.vote == "FIXED")
    broken_count = sum(1 for v in all_votes if v.vote == "STILL_BROKEN")
    total_votes = len(all_votes)

    status_changed = False
    new_status = issue.status

    # Configurable consensus threshold
    if total_votes >= 3 and fixed_count >= 2 and (fixed_count / total_votes) >= 0.65:
        # Issue genuinely fixed according to community!
        issue.status = "Resolved"
        new_status = "Resolved"
        status_changed = True
        db.add(AuditLog(
            issue_id=issue.id,
            actor_name="Community Consensus Engine",
            actor_role="system",
            action="Issue Permanently Resolved",
            details=f"Community verification threshold met ({fixed_count} Fixed vs {broken_count} Still Broken). Ticket officially closed.",
            timestamp=datetime.utcnow()
        ))
    elif broken_count >= 2 and (broken_count / total_votes) >= 0.5:
        # Community reports defect still exists!
        issue.status = "Disputed"
        new_status = "Disputed"
        status_changed = True
        db.add(AuditLog(
            issue_id=issue.id,
            actor_name="Community Consensus Engine",
            actor_role="system",
            action="Repair Disputed by Community",
            details=f"Neighborhood verifiers rejected repair claims ({broken_count} Still Broken votes). Reopened for manual inspection.",
            timestamp=datetime.utcnow()
        ))

    db.add(AuditLog(
        issue_id=issue.id,
        actor_name=payload.citizen_name or "Neighborhood Citizen",
        actor_role="citizen",
        action=f"Community Verification Vote: {payload.vote}",
        details=payload.comments or "Citizen verified issue ground-truth in person.",
        timestamp=datetime.utcnow()
    ))

    db.commit()

    return {
        "success": True,
        "current_status": new_status,
        "status_changed": status_changed,
        "fixed_count": fixed_count,
        "broken_count": broken_count,
        "total_votes": total_votes
    }
