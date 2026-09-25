from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    worker_code = Column(String, unique=True, index=True, nullable=False)  # e.g. WRK-2026-001
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # Department: Road Maintenance, Electrical, Water Supply, Drainage, Sanitation, Parks & Trees, Public Infrastructure, Emergency Maintenance
    department = Column(String, index=True, nullable=False)
    specialization = Column(String, nullable=False)
    
    primary_ward = Column(String, index=True, nullable=False)
    secondary_wards = Column(String, default="")  # Comma separated e.g. "Ward 04 - Koramangala, Ward 08 - Jayanagar"
    
    # Availability: Available, Working, Off Duty, On Leave
    availability = Column(String, default="Available", index=True)
    current_workload = Column(Integer, default=0)
    completed_jobs = Column(Integer, default=0)
    avg_resolution_hours = Column(Float, default=24.0)
    rating = Column(Float, default=4.8)
    sla_compliance_pct = Column(Float, default=95.0)
    status = Column(String, default="Active")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
