from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)  # Pothole, Broken Streetlight, Open Drain, Garbage, Water Leakage, Road Damage, Other
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    ward = Column(String, index=True, nullable=True)
    ward_id = Column(String, index=True, nullable=True)
    status = Column(String, index=True, default="REPORTED")
    # Statuses: REPORTED, ACKNOWLEDGED, ASSIGNED, IN_PROGRESS, REPAIR_SUBMITTED, UNDER_REVIEW, RESOLVED, REOPENED, ESCALATED
    
    is_emergency = Column(Boolean, default=False)
    hazard_type = Column(String, nullable=True)
    
    priority_score = Column(Float, default=50.0)  # 0 to 100
    priority_level = Column(String, default="Medium")  # Low, Medium, High, Critical
    report_count = Column(Integer, default=1)
    upvotes = Column(Integer, default=0)
    support_count = Column(Integer, default=0)
    
    reporter_name = Column(String, default="Citizen")
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_worker_id = Column(Integer, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    work_started_at = Column(DateTime, nullable=True)
    work_completed_at = Column(DateTime, nullable=True)
    worker_completion_note = Column(Text, nullable=True)
    citizen_verified = Column(Boolean, default=False)
    citizen_verified_at = Column(DateTime, nullable=True)
    citizen_rejection_reason = Column(Text, nullable=True)
    
    before_image_url = Column(String, nullable=False)
    after_image_url = Column(String, nullable=True)
    
    escalation_deadline = Column(DateTime, nullable=False)
    escalation_due_at = Column(DateTime, nullable=True)
    escalation_level = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reports = relationship("IssueReport", back_populates="issue", cascade="all, delete-orphan")
    images = relationship("IssueImage", back_populates="issue", cascade="all, delete-orphan")
    upvote_records = relationship("Upvote", back_populates="issue", cascade="all, delete-orphan")
    repair_submissions = relationship("RepairSubmission", back_populates="issue", cascade="all, delete-orphan")
    ai_verifications = relationship("AiVerification", back_populates="issue", cascade="all, delete-orphan")
    community_votes = relationship("CommunityVerification", back_populates="issue", cascade="all, delete-orphan")
    escalations = relationship("Escalation", back_populates="issue", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="issue", cascade="all, delete-orphan")


class IssueReport(Base):
    __tablename__ = "issue_reports"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    reporter_name = Column(String, default="Citizen")
    reporter_contact = Column(String, nullable=True)  # Kept private, never exposed in public responses
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_duplicate_merge = Column(Boolean, default=False)
    similarity_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="reports")


class IssueImage(Base):
    __tablename__ = "issue_images"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    image_type = Column(String, default="before")  # before, after, community, merge
    image_url = Column(String, nullable=False)
    uploaded_by_name = Column(String, default="Citizen")
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="images")


class Upvote(Base):
    __tablename__ = "upvotes"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    user_identifier = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="upvote_records")
