from pydantic import BaseModel
from typing import List, Dict, Any

class CategoryCount(BaseModel):
    category: str
    count: int

class StatusCount(BaseModel):
    status: str
    count: int

class WardCount(BaseModel):
    ward: str
    count: int
    critical_count: int

class ResolutionTrend(BaseModel):
    date: str
    reported: int
    resolved: int
    escalated: int

class AnalyticsSummary(BaseModel):
    total_issues: int
    open_issues: int
    in_progress_issues: int
    resolved_issues: int
    escalated_issues: int
    disputed_issues: int
    citizens_participating: int
    duplicate_merges_count: int
    average_resolution_hours: float
    categories: List[CategoryCount]
    statuses: List[StatusCount]
    wards: List[WardCount]
    trend: List[ResolutionTrend]
