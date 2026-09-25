from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class IssueBase(BaseModel):
    category: str
    description: str
    latitude: float
    longitude: float
    address: str
    title: Optional[str] = None
    ward: Optional[str] = None
    ward_id: Optional[str] = None

class IssueCreate(IssueBase):
    photo: Optional[str] = None
    image_base64: Optional[str] = None
    photo_url: Optional[str] = None
    severity: Optional[str] = None
    is_emergency: Optional[bool] = False
    hazard_type: Optional[str] = None
    reporter_name: Optional[str] = "Citizen"
    reporter_contact: Optional[str] = None

class IssueResponse(BaseModel):
    id: int
    ticket_id: str
    category: str
    title: str
    description: str
    status: str
    priority_level: str
    priority_score: float
    latitude: float
    longitude: float
    address: str
    ward: Optional[str] = None
    ward_id: Optional[str] = None
    before_image_url: str
    report_count: int = 1
    support_count: int = 0
    created_at: datetime
    escalation_due_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class IssueReportItem(BaseModel):
    id: int
    reporter_name: str
    description: Optional[str]
    image_url: Optional[str]
    is_duplicate_merge: bool
    similarity_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True

class IssueImageItem(BaseModel):
    id: int
    image_type: str
    image_url: str
    uploaded_by_name: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class IssueSummary(BaseModel):
    id: int
    ticket_id: str
    category: str
    title: str
    description: str
    latitude: float
    longitude: float
    address: str
    ward: Optional[str] = None
    ward_id: Optional[str] = None
    status: str
    priority_score: float
    priority_level: str
    report_count: int
    upvotes: int
    support_count: Optional[int] = 0
    before_image_url: str
    after_image_url: Optional[str] = None
    escalation_deadline: Optional[datetime] = None
    escalation_due_at: Optional[datetime] = None
    escalation_level: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DuplicateMatch(BaseModel):
    issue_id: int
    ticket_id: str
    title: str
    category: str
    ward: Optional[str] = "Ward 12 - Indiranagar"
    distance_meters: float
    confidence_score: float
    breakdown: dict
    before_image_url: str
    address: str
    status: str
    report_count: int
    created_at: datetime

class DuplicateCheckRequest(BaseModel):
    category: str
    latitude: float
    longitude: float
    image_base64: Optional[str] = None
    description: Optional[str] = None

class DuplicateCheckResponse(BaseModel):
    is_possible_duplicate: bool
    best_match: Optional[DuplicateMatch] = None
    all_matches: List[DuplicateMatch] = []

class DuplicateMergeRequest(BaseModel):
    target_issue_id: int
    reporter_name: Optional[str] = "Citizen"
    reporter_contact: Optional[str] = None
    description: Optional[str] = None
    image_base64: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
