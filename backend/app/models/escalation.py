from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    level = Column(Integer, default=1)  # Level 1: Municipal Chief Email, Level 2: Public X Post
    trigger_type = Column(String, default="automatic_deadline")  # automatic_deadline or manual_admin
    
    authority_name = Column(String, nullable=False)
    authority_email = Column(String, nullable=False)
    email_subject = Column(String, nullable=False)
    email_body = Column(Text, nullable=False)
    
    x_post_text = Column(Text, nullable=True)
    x_post_status = Column(String, default="simulated")  # simulated, queued, published
    
    status = Column(String, default="sent")  # sent, queued, simulated
    sent_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="escalations")


class MunicipalContact(Base):
    __tablename__ = "municipal_contacts"

    id = Column(Integer, primary_key=True, index=True)
    ward = Column(String, index=True, nullable=False)
    department = Column(String, nullable=False)
    official_name = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    email = Column(String, nullable=False)
    twitter_handle = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    escalation_level = Column(Integer, default=1)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    actor_name = Column(String, default="System")
    actor_role = Column(String, default="system")  # system, citizen, worker, admin
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="audit_logs")
