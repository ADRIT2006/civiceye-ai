from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from datetime import datetime
from app.database import Base

class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, unique=True, index=True, nullable=False)  # e.g. REP-2026-0001
    ticket_id = Column(String, index=True, nullable=False)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    
    category = Column(String, nullable=False)
    title = Column(String, nullable=False)
    ward = Column(String, index=True, nullable=False)
    location_address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    worker_name = Column(String, nullable=True)
    worker_department = Column(String, nullable=True)
    
    date_reported = Column(DateTime, nullable=False)
    date_assigned = Column(DateTime, nullable=True)
    date_started = Column(DateTime, nullable=True)
    date_completed = Column(DateTime, nullable=True)
    resolution_time_hours = Column(Float, default=0.0)
    
    priority_level = Column(String, default="Medium")
    citizen_report_count = Column(Integer, default=1)
    
    before_image_url = Column(String, nullable=True)
    after_image_url = Column(String, nullable=True)
    
    ai_verification_status = Column(String, nullable=True)
    ai_inlier_ratio = Column(Float, default=0.0)
    community_consensus_pct = Column(Float, default=0.0)
    
    worker_notes = Column(Text, nullable=True)
    admin_verification = Column(String, default="Approved by Commissioner Dr. Arvind Verma, IAS")
    final_status = Column(String, default="Resolved")
    
    # Strictly factual AI generated summary paragraph
    summary_text = Column(Text, nullable=False)
    
    # Serialized complete JSON snapshot of all fields
    data_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, default="Dr. Arvind Verma (Municipal Commissioner)")
