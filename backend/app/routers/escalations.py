from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.issue import Issue
from app.models.escalation import Escalation, MunicipalContact
from app.schemas.escalation import EscalationItem, MunicipalContactItem
from app.services.escalation_engine import trigger_issue_escalation, check_and_escalate_overdue_issues

router = APIRouter(prefix="/api/escalations", tags=["Escalations"])

@router.get("", response_model=List[EscalationItem])
def list_escalations(db: Session = Depends(get_db)):
    """Fetches all escalations and communications history."""
    escalations = db.query(Escalation).order_by(Escalation.sent_at.desc()).all()
    # Attach ticket_id
    result = []
    for e in escalations:
        item = EscalationItem(
            id=e.id,
            issue_id=e.issue_id,
            ticket_id=e.issue.ticket_id if e.issue else f"CIV-{e.issue_id}",
            level=e.level,
            trigger_type=e.trigger_type,
            authority_name=e.authority_name,
            authority_email=e.authority_email,
            email_subject=e.email_subject,
            email_body=e.email_body,
            x_post_text=e.x_post_text,
            x_post_status=e.x_post_status,
            status=e.status,
            sent_at=e.sent_at
        )
        result.append(item)
    return result

@router.post("/trigger-cron", response_model=dict)
def trigger_escalation_cron(db: Session = Depends(get_db)):
    """Runs background escalation check for overdue issues."""
    escalated = check_and_escalate_overdue_issues(db)
    return {
        "success": True,
        "escalated_count": len(escalated),
        "escalated_tickets": [e.issue.ticket_id for e in escalated if e.issue]
    }

@router.post("/manual/{issue_id}", response_model=dict)
def manual_escalate(issue_id: int, level: int = 1, db: Session = Depends(get_db)):
    """Manually escalates a specific issue (Admin action)."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    esc = trigger_issue_escalation(
        db,
        issue,
        level=level,
        manual=True,
        actor_name="Admin Commissioner",
        actor_role="admin"
    )

    return {
        "success": True,
        "message": f"Issue {issue.ticket_id} escalated to Level {level}.",
        "escalation_id": esc.id,
        "status": issue.status
    }

@router.get("/contacts", response_model=List[MunicipalContactItem])
def list_contacts(db: Session = Depends(get_db)):
    """Lists registered municipal authority contacts across administrative wards."""
    return db.query(MunicipalContact).all()
