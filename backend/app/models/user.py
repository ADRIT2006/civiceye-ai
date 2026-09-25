from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="citizen")  # citizen, worker, admin
    department = Column(String, nullable=True)  # e.g., "Roads & Infrastructure"
    ward = Column(String, nullable=True)  # e.g., "Ward 12"
    phone = Column(String, nullable=True)
    confirmed_credits = Column(Integer, default=0)
    pending_credits = Column(Integer, default=0)
    rejected_credits = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
