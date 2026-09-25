from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=True)
    ticket_id = Column(String, nullable=True)
    
    # Points awarded / pending
    amount = Column(Integer, nullable=False)
    
    # Activity Type:
    # "Valid Issue Report" (+10)
    # "Duplicate Merged" (+5)
    # "Useful Additional Evidence" (+5)
    # "Community Verification" (+3)
    # "Resolution Bonus" (+10)
    # "High-Impact Verified Report" (+15)
    activity_type = Column(String, nullable=False)
    
    # Status: "Pending", "Confirmed", "Rejected"
    status = Column(String, default="Pending", index=True)
    description = Column(Text, nullable=False)
    
    # Anti-abuse detection
    is_flagged_suspicious = Column(Boolean, default=False)
    flag_reason = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
