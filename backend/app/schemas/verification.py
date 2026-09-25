from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RepairSubmitRequest(BaseModel):
    worker_name: Optional[str] = "Municipal Road Crew"
    repair_notes: str
    materials_used: Optional[str] = None
    after_image_base64: str

class AiVerificationDetail(BaseModel):
    id: int
    location_match_score: float
    scene_match_score: float
    repair_confidence_score: float
    suspicion_level: str
    verification_status: str
    diagnostic_summary: Optional[str]
    failure_reasons: Optional[List[str]] = []
    heatmap_url: Optional[str]
    verified_at: datetime

    class Config:
        from_attributes = True

class CommunityVoteRequest(BaseModel):
    citizen_name: Optional[str] = "Citizen Verifier"
    vote: str  # FIXED or STILL_BROKEN
    comments: Optional[str] = None
    evidence_image_base64: Optional[str] = None

class CommunityVoteSummary(BaseModel):
    fixed_count: int
    still_broken_count: int
    total_votes: int
    pass_threshold_met: bool
    status_label: str

class CitizenVerifyRequest(BaseModel):
    verified: bool
    reason: Optional[str] = None
    citizen_name: Optional[str] = "Citizen"
