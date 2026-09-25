from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.database import Base

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, default="emergency")  # emergency, police, medical, fire, helpline
    is_primary = Column(Boolean, default=False)
    active = Column(Boolean, default=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_role = Column(String, nullable=False)  # citizen, worker, admin, all
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default="alert")  # alert, escalation, assignment, verification, emergency
    ticket_id = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
