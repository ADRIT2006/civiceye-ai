from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.emergency import EmergencyContact, Notification
from app.models.issue import Issue
from app.services.rbac import require_role

router = APIRouter(prefix="/api/emergency", tags=["Emergency Services"])

class EmergencyContactItem(BaseModel):
    id: int
    service_name: str
    phone_number: str
    description: str
    category: str
    is_primary: bool
    active: bool

    class Config:
        from_attributes = True

class NotificationItem(BaseModel):
    id: int
    recipient_role: str
    title: str
    message: str
    category: str
    ticket_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/contacts", response_model=List[EmergencyContactItem])
def get_emergency_contacts(db: Session = Depends(get_db)):
    """Fetches configured jurisdiction emergency response numbers."""
    contacts = db.query(EmergencyContact).filter(EmergencyContact.active == True).order_by(EmergencyContact.is_primary.desc(), EmergencyContact.id.asc()).all()
    return contacts

@router.get("/incidents")
def get_emergency_incidents(db: Session = Depends(get_db)):
    """Fetches active critical civic hazards and emergency reports."""
    incidents = db.query(Issue).filter(
        (Issue.is_emergency == True) | 
        (Issue.category == "CRITICAL PUBLIC HAZARD") |
        (Issue.priority_level == "Critical")
    ).order_by(Issue.created_at.desc()).all()

    return [
        {
            "id": i.id,
            "ticket_id": i.ticket_id,
            "category": i.category,
            "title": i.title,
            "address": i.address,
            "ward": i.ward,
            "status": i.status,
            "priority_level": i.priority_level,
            "is_emergency": i.is_emergency,
            "hazard_type": i.hazard_type,
            "before_image_url": i.before_image_url,
            "created_at": i.created_at.isoformat()
        } for i in incidents
    ]

@router.get("/notifications", response_model=List[NotificationItem])
def get_role_notifications(
    role: str = Query("citizen"),
    db: Session = Depends(get_db)
):
    """Fetches role-specific notifications (Citizen, Worker, Admin)."""
    norm_role = role.lower().strip()
    notifications = db.query(Notification).filter(
        (Notification.recipient_role == norm_role) | 
        (Notification.recipient_role == "all")
    ).order_by(Notification.created_at.desc()).limit(20).all()
    return notifications

@router.post("/notifications/read/{id}")
def mark_notification_read(id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}
