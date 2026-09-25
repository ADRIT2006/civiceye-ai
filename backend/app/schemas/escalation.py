from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EscalationItem(BaseModel):
    id: int
    issue_id: int
    ticket_id: Optional[str] = None
    level: int
    trigger_type: str
    authority_name: str
    authority_email: str
    email_subject: str
    email_body: str
    x_post_text: Optional[str]
    x_post_status: str
    status: str
    sent_at: datetime

    class Config:
        from_attributes = True

class MunicipalContactItem(BaseModel):
    id: int
    ward: str
    department: str
    official_name: str
    designation: str
    email: str
    twitter_handle: Optional[str]
    phone: Optional[str]
    escalation_level: int

    class Config:
        from_attributes = True

class AuditLogItem(BaseModel):
    id: int
    issue_id: int
    actor_name: str
    actor_role: str
    action: str
    details: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True
