from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.issue import Issue
from app.models.escalation import Escalation, MunicipalContact, AuditLog
from app.services.email_service import format_escalation_email, send_or_queue_escalation_email
from app.services.x_service import format_public_x_post, post_or_queue_x_escalation
from app.services.priority_engine import calculate_priority_score
from app.config import settings

def get_authority_for_ward(db: Session, ward: str) -> MunicipalContact:
    """Finds municipal contact for ward or defaults to City Commissioner."""
    contact = db.query(MunicipalContact).filter(MunicipalContact.ward == ward).first()
    if not contact:
        contact = db.query(MunicipalContact).first()
    return contact

def trigger_issue_escalation(
    db: Session,
    issue: Issue,
    level: int = 1,
    manual: bool = False,
    actor_name: str = "System Escalation Engine",
    actor_role: str = "system"
) -> Escalation:
    """
    Executes an escalation for a given issue:
    - Level 1: Official Municipal Email + Status 'Escalated'
    - Level 2: Public X/Twitter Accountability Post
    """
    contact = get_authority_for_ward(db, issue.ward)
    authority_name = contact.official_name if contact else "Municipal Commissioner"
    authority_email = contact.email if contact else settings.MUNICIPAL_CHIEF_EMAIL

    # Format email
    email_data = format_escalation_email(
        ticket_id=issue.ticket_id,
        category=issue.category,
        ward=issue.ward,
        address=issue.address,
        lat=issue.latitude,
        lon=issue.longitude,
        report_count=issue.report_count,
        created_at=issue.created_at,
        status=issue.status,
        authority_name=authority_name
    )

    # Format X post
    x_post = format_public_x_post(
        ticket_id=issue.ticket_id,
        category=issue.category,
        ward=issue.ward,
        report_count=issue.report_count,
        status="Escalated"
    )

    # Execute / queue actions
    email_res = send_or_queue_escalation_email(authority_email, email_data["subject"], email_data["body"])
    x_res = post_or_queue_x_escalation(x_post)

    # Save Escalation record
    escalation = Escalation(
        issue_id=issue.id,
        level=level,
        trigger_type="manual_admin" if manual else "automatic_deadline",
        authority_name=authority_name,
        authority_email=authority_email,
        email_subject=email_data["subject"],
        email_body=email_data["body"],
        x_post_text=x_post,
        x_post_status=x_res.get("status", "simulated"),
        status=email_res.get("status", "simulated"),
        sent_at=datetime.utcnow()
    )
    db.add(escalation)

    # Update Issue status and priority
    issue.status = "Escalated"
    issue.escalation_level = max(issue.escalation_level, level)
    
    # Recalculate priority with escalation boost
    score, p_level = calculate_priority_score(
        category=issue.category,
        report_count=issue.report_count,
        upvotes=issue.upvotes,
        created_at=issue.created_at,
        is_escalated=True
    )
    issue.priority_score = score
    issue.priority_level = p_level

    # Record Audit Log
    trigger_desc = "Manual Admin Override" if manual else f"48-Hour Resolution SLA Exceeded (Level {level})"
    audit = AuditLog(
        issue_id=issue.id,
        actor_name=actor_name,
        actor_role=actor_role,
        action=f"Escalation Level {level} Triggered",
        details=f"{trigger_desc}. Sent official grievance to {authority_email} and generated public accountability broadcast."
    )
    db.add(audit)
    db.commit()
    db.refresh(escalation)
    db.refresh(issue)

    return escalation

def check_and_escalate_overdue_issues(db: Session) -> List[Escalation]:
    """
    Checks all unresolved issues where current_time >= escalation_deadline.
    """
    now = datetime.utcnow()
    overdue_issues = db.query(Issue).filter(
        Issue.status.notin_(["Resolved", "Disputed"]),
        Issue.escalation_deadline <= now,
        Issue.escalation_level < 1
    ).all()

    escalations = []
    for issue in overdue_issues:
        esc = trigger_issue_escalation(db, issue, level=1, manual=False)
        escalations.append(esc)

    return escalations
