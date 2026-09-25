from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class RepairSubmission(Base):
    __tablename__ = "repair_submissions"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    worker_id = Column(Integer, nullable=True)
    worker_name = Column(String, default="Municipal Road Crew")
    repair_notes = Column(Text, nullable=False)
    materials_used = Column(String, nullable=True)
    after_image_url = Column(String, nullable=False)
    status = Column(String, default="pending_review")  # pending_review, approved, rejected, disputed
    submitted_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="repair_submissions")
    ai_verification = relationship("AiVerification", back_populates="repair_submission", uselist=False)


class AiVerification(Base):
    __tablename__ = "ai_verifications"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    repair_submission_id = Column(Integer, ForeignKey("repair_submissions.id"), nullable=True)
    
    location_match_score = Column(Float, default=0.0)    # 0 to 100
    scene_match_score = Column(Float, default=0.0)       # 0 to 100
    repair_confidence_score = Column(Float, default=0.0)  # 0 to 100
    suspicion_level = Column(String, default="LOW")      # LOW, MEDIUM, HIGH
    verification_status = Column(String, default="PASSED") # PASSED, SUSPICIOUS, FAILED
    
    diagnostic_summary = Column(Text, nullable=True)
    failure_reasons = Column(Text, nullable=True)  # JSON-encoded array of flags
    heatmap_url = Column(String, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="ai_verifications")
    repair_submission = relationship("RepairSubmission", back_populates="ai_verification")


class CommunityVerification(Base):
    __tablename__ = "community_verifications"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    citizen_name = Column(String, default="Citizen Verifier")
    vote = Column(String, nullable=False)  # FIXED or STILL_BROKEN
    comments = Column(Text, nullable=True)
    evidence_image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="community_votes")
