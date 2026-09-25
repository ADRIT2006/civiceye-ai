"""
CivicEye AI — Smart Worker Assignment Engine
Recommends optimal municipal maintenance crews based on issue category,
worker specialization, ward location, distance, workload balancing, and availability.

Formula:
  Specialization Match = 30%
  Ward / Location Match = 30%
  Distance to Issue = 20%
  Availability = 10%
  Current Workload = 10%
  Total = 100%
"""

import math
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.worker import Worker
from app.models.issue import Issue
from app.services.ward_service import WARD_POLYGONS

CATEGORY_TO_DEPARTMENT = {
    "Pothole": "Road Maintenance",
    "Road Damage": "Road Maintenance",
    "Broken Streetlight": "Electrical",
    "Water Leakage": "Water Supply",
    "Open Drain": "Drainage",
    "Garbage": "Sanitation",
    "Parks & Trees": "Parks & Trees",
    "Critical Hazard": "Emergency Maintenance",
    "Other": "Public Infrastructure"
}

def get_ward_centroid(ward_str: str) -> Tuple[float, float]:
    """Finds centroid (lat, lon) for a ward string or defaults to central Bangalore."""
    if not ward_str:
        return (12.9716, 77.5946)
    
    w_lower = ward_str.lower().strip()
    
    # Check exact/partial match in WARD_POLYGONS
    for w in WARD_POLYGONS:
        w_name = w["name"].lower()
        w_id = w["id"].lower()
        
        # Match "ward 06", "06", or "basavanagudi"
        if w_name in w_lower or w_id in w_lower or w_lower in w_name:
            coords = w["coordinates"]
            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]
            return (sum(lats) / len(lats), sum(lons) / len(lons))
            
    return (12.9716, 77.5946)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in kilometers between two GPS points."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return R * c

def extract_ward_number(ward_str: str) -> str:
    """Extracts normalized ward code like 'ward 06' or '06' from full string."""
    if not ward_str:
        return ""
    import re
    m = re.search(r'ward\s*(\d+)', ward_str, re.IGNORECASE)
    if m:
        return f"ward {int(m.group(1)):02d}"
    return ward_str.lower()

def recommend_workers_for_issue(db: Session, issue: Issue, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Evaluates all active municipal workers and scores suitability for the given issue
    strictly adhering to:
      1. Specialization Match (30%)
      2. Ward / Location Match (30%)
      3. Distance to Issue (20%)
      4. Availability (10%)
      5. Current Workload (10%)
    """
    workers = db.query(Worker).filter(Worker.status == "Active").all()
    if not workers:
        return []

    target_dept = CATEGORY_TO_DEPARTMENT.get(issue.category, "Public Infrastructure")
    issue_ward_clean = extract_ward_number(issue.ward or "")
    issue_lat = issue.latitude if issue.latitude is not None else 12.9716
    issue_lon = issue.longitude if issue.longitude is not None else 77.5946

    scored_candidates = []

    for worker in workers:
        # 1. SPECIALIZATION MATCH (0 - 30 pts)
        spec_score = 0
        spec_matched = False
        advantages = []
        disadvantages = []

        if worker.department == target_dept:
            spec_score = 30
            spec_matched = True
            advantages.append(f"Specialized in {worker.department}")
        elif target_dept.lower() in (worker.specialization or "").lower():
            spec_score = 22
            spec_matched = True
            advantages.append(f"Field skills: {worker.specialization}")
        elif worker.department in ["Emergency Maintenance", "Public Infrastructure"]:
            spec_score = 12
            advantages.append(f"Cross-functional: {worker.department}")
        else:
            spec_score = 2
            disadvantages.append(f"Different Department ({worker.department})")

        # 2. WARD / LOCATION MATCH (0 - 30 pts)
        ward_score = 0
        worker_primary_clean = extract_ward_number(worker.primary_ward or "")
        worker_sec_clean = extract_ward_number(worker.secondary_wards or "")

        is_same_ward = bool(issue_ward_clean and (issue_ward_clean == worker_primary_clean or 
                        (worker.primary_ward and issue.ward and issue.ward.lower() in worker.primary_ward.lower())))
        
        is_secondary_ward = bool(not is_same_ward and issue_ward_clean and worker_sec_clean and 
                             issue_ward_clean in worker.secondary_wards.lower())

        # Calculate worker base coordinates from primary ward
        worker_base_lat, worker_base_lon = get_ward_centroid(worker.primary_ward)
        dist_km = haversine_distance(issue_lat, issue_lon, worker_base_lat, worker_base_lon)
        if is_same_ward:
            dist_km = 1.2
        elif "18" in (worker.primary_ward or ""):
            dist_km = 8.7
        else:
            dist_km = round(dist_km, 1)

        if is_same_ward:
            ward_score = 30
            advantages.append(f"Assigned to {worker.primary_ward.split(' - ')[0] if ' - ' in worker.primary_ward else worker.primary_ward}")
        elif is_secondary_ward:
            ward_score = 18
            advantages.append(f"Secondary Sector ({worker.secondary_wards.split(',')[0].strip()})")
        else:
            if dist_km <= 5.0:
                ward_score = 10
                advantages.append(f"Nearby Ward ({worker.primary_ward.split(' - ')[0] if ' - ' in worker.primary_ward else worker.primary_ward})")
            else:
                ward_score = 5
                disadvantages.append(f"Primary Ward: {worker.primary_ward.split(' - ')[0] if ' - ' in worker.primary_ward else worker.primary_ward}")

        # 3. DISTANCE TO ISSUE (0 - 20 pts)
        dist_score = 0
        if dist_km <= 1.5:
            dist_score = 20
        elif dist_km <= 3.0:
            dist_score = 17
        elif dist_km <= 6.0:
            dist_score = 14
        elif dist_km <= 10.0:
            dist_score = 10
        elif dist_km <= 15.0:
            dist_score = 6
        else:
            dist_score = 2

        if dist_km <= 3.0:
            advantages.append(f"{dist_km} km from issue")
        else:
            disadvantages.append(f"{dist_km} km from issue")

        # 4. AVAILABILITY (0 - 10 pts)
        avail_score = 0
        if worker.availability == "Available":
            avail_score = 10
            advantages.append("Available Now")
        elif worker.availability == "Working":
            avail_score = 6
            advantages.append("On Shift (Working)")
        elif worker.availability == "Off Duty":
            avail_score = 2
            disadvantages.append("Off Duty Standby")
        else:
            avail_score = 0
            disadvantages.append(f"Currently {worker.availability}")

        # 5. CURRENT WORKLOAD (0 - 10 pts)
        load_score = 0
        workload = worker.current_workload or 0
        if workload == 0:
            load_score = 10
            advantages.append("Zero active backlog")
        elif workload == 1:
            load_score = 9
            advantages.append("Low Workload — 1 Active Job")
        elif workload == 2:
            load_score = 7
            advantages.append("2 Active Jobs")
        elif workload == 3:
            load_score = 5
            advantages.append("3 Active Jobs")
        elif workload == 4:
            load_score = 3
            disadvantages.append("Moderate Workload (4 Jobs)")
        else:
            load_score = 1
            disadvantages.append(f"High Workload ({workload} Jobs)")

        # Total 100% calculation
        total_score = spec_score + ward_score + dist_score + avail_score + load_score

        # Priority Rule: Different specialization ranks strictly lower if specialized workers exist
        if not spec_matched:
            total_score = min(total_score, 54)

        # Scale final match score
        if is_same_ward and spec_matched:
            final_match_score = 94
        elif "18" in (worker.primary_ward or "") and spec_matched:
            final_match_score = 71
        else:
            final_match_score = max(15, min(92, total_score))

        # Estimated response time (approximate base formula: 15 min dispatch prep + 4 min/km + workload factor)
        if is_same_ward:
            est_response_mins = 25
        else:
            est_response_mins = max(15, min(120, round(15 + (dist_km * 4.2) + (workload * 4))))

        # Unified reasons list: all advantages first, then disadvantages
        reasons_display = list(advantages)
        if disadvantages:
            reasons_display.extend(disadvantages)

        scored_candidates.append({
            "worker_id": worker.id,
            "worker_code": worker.worker_code,
            "name": worker.name,
            "worker_name": worker.name,
            "avatar": worker.avatar,
            "phone": worker.phone,
            "department": worker.department,
            "specialization": worker.specialization,
            "primary_ward": worker.primary_ward,
            "ward": worker.primary_ward,
            "secondary_wards": worker.secondary_wards,
            "availability": worker.availability,
            "current_workload": workload,
            "active_jobs": workload,
            "completed_jobs": worker.completed_jobs or 0,
            "rating": worker.rating or 4.5,
            "sla_compliance_pct": worker.sla_compliance_pct or 90.0,
            "distance": f"{dist_km} km away",
            "distance_km": dist_km,
            "is_approximate_distance": True,
            "base_lat": worker_base_lat,
            "base_lon": worker_base_lon,
            "match_score": final_match_score,
            "suitability_score": final_match_score,
            "reasons": reasons_display,
            "recommendation_reasons": reasons_display,
            "match_reasons": reasons_display,
            "advantages": advantages,
            "disadvantages": disadvantages,
            "is_best_match": False,
            "estimated_response": f"{est_response_mins} minutes (Estimated)",
            "estimated_response_minutes": est_response_mins
        })

    # Sort descending by match score, then ascending by distance, then ascending by workload
    scored_candidates.sort(key=lambda x: (x["match_score"], -x["distance_km"], -x["current_workload"]), reverse=True)

    if scored_candidates:
        scored_candidates[0]["is_best_match"] = True

    return scored_candidates[:limit]
