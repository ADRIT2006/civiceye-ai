from datetime import datetime

CATEGORY_SEVERITY = {
    "Electrical Hazard": 45.0,
    "Open Manhole": 40.0,
    "Open Drain": 30.0,
    "Road Damage": 24.0,
    "Pothole": 22.0,
    "Water Leakage": 18.0,
    "Broken Streetlight": 16.0,
    "Public Infrastructure": 16.0,
    "Garbage": 14.0,
    "Other": 12.0,
}

def calculate_priority_score(
    category: str,
    report_count: int = 1,
    upvotes: int = 0,
    created_at: datetime = None,
    is_escalated: bool = False,
    is_near_sensitive: bool = False,
    severity: str = None,
    is_emergency: bool = False
) -> tuple[float, str]:
    """
    Computes deterministic priority score (0 to 100) and priority level:
    - Base category risk severity (12 - 45)
    - Safety / Severity weighting (up to 30)
    - Citizen voice & report count (up to 35)
    - Age/time elapsed (up to 20)
    - Proximity & escalation factors (up to 25)
    """
    if created_at is None:
        created_at = datetime.utcnow()

    # 1. Base category severity
    base = CATEGORY_SEVERITY.get(category, 15.0)
    
    # 2. Safety / Severity weighting
    sev_component = 0.0
    if is_emergency:
        sev_component = 30.0
    elif severity:
        sev_clean = str(severity).strip().lower()
        if sev_clean in ["critical", "severe", "urgent"]:
            sev_component = 25.0
        elif sev_clean in ["high", "elevated"]:
            sev_component = 15.0
        elif sev_clean in ["medium", "moderate"]:
            sev_component = 5.0
    
    # 3. Citizen voice (each report +2.2, upvote +1.0, max 35)
    citizen_component = min(35.0, (report_count * 2.2) + (upvotes * 0.8))
    
    # 4. Age component (1 pt per 8 hours unresolved, max 20)
    now = datetime.utcnow()
    hours_elapsed = max(0, (now - created_at).total_seconds() / 3600.0)
    age_component = min(20.0, hours_elapsed / 8.0)
    
    # 5. Sensitive location proximity (schools, hospitals, transit)
    sensitive_component = 10.0 if is_near_sensitive else 0.0
    
    # 6. Escalation component
    escalation_component = 15.0 if is_escalated else 0.0
    
    total = base + sev_component + citizen_component + age_component + sensitive_component + escalation_component
    score = round(min(100.0, max(1.0, total)), 1)
    
    # Deterministic Priority Level
    if score >= 75.0 or category in ["Electrical Hazard", "Open Manhole"] and (is_emergency or sev_component >= 15.0):
        level = "Critical"
    elif score >= 55.0 or category in ["Electrical Hazard", "Open Manhole"]:
        level = "High"
    elif score >= 35.0:
        level = "Medium"
    else:
        level = "Low"
        
    return score, level
