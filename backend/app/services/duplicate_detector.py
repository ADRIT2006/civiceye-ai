import math
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
import numpy as np
import cv2

from app.models.issue import Issue
from app.services.image_utils import load_image_cv2, compute_dhash, dhash_similarity

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great circle distance in meters between two coordinates."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def compare_images_cv(img1_cv, img2_cv) -> float:
    """Compares two OpenCV images using dHash and color histogram correlation."""
    if img1_cv is None or img2_cv is None:
        return 0.5  # Neutral baseline if one image missing

    try:
        # 1. dHash similarity
        h1 = compute_dhash(img1_cv)
        h2 = compute_dhash(img2_cv)
        sim_hash = dhash_similarity(h1, h2)

        # 2. Color histogram correlation
        hsv1 = cv2.cvtColor(img1_cv, cv2.COLOR_BGR2HSV)
        hsv2 = cv2.cvtColor(img2_cv, cv2.COLOR_BGR2HSV)
        hist1 = cv2.calcHist([hsv1], [0, 1], None, [30, 32], [0, 180, 0, 256])
        hist2 = cv2.calcHist([hsv2], [0, 1], None, [30, 32], [0, 180, 0, 256])
        cv2.normalize(hist1, hist1, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        cv2.normalize(hist2, hist2, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        sim_hist = max(0.0, float(cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)))

        # Weighted combination
        return round(0.55 * sim_hash + 0.45 * sim_hist, 3)
    except Exception:
        return 0.5

def evaluate_duplicate_candidate(
    new_category: str,
    new_lat: float,
    new_lon: float,
    new_img_cv,
    existing_issue: Issue
) -> Tuple[float, Dict[str, Any], float]:
    """
    Evaluates duplicate probability between a new submission and an existing issue.
    Returns: (total_score_0_to_100, breakdown_dict, distance_meters)
    """
    # 1. Distance score (max 40)
    dist = haversine_distance_meters(new_lat, new_lon, existing_issue.latitude, existing_issue.longitude)
    if dist <= 30:
        dist_score = 40.0
    elif dist <= 60:
        dist_score = 40.0 - ((dist - 30) / 30.0) * 15.0  # 40 -> 25
    elif dist <= 120:
        dist_score = 25.0 - ((dist - 60) / 60.0) * 20.0  # 25 -> 5
    elif dist <= 200:
        dist_score = 5.0 - ((dist - 120) / 80.0) * 5.0
    else:
        dist_score = 0.0

    # 2. Category score (max 20)
    cat_score = 20.0 if new_category.strip().lower() == existing_issue.category.strip().lower() else 0.0

    # 3. Visual similarity score (max 30)
    if new_img_cv is not None and existing_issue.before_image_url:
        existing_img_cv = load_image_cv2(existing_issue.before_image_url)
        img_sim = compare_images_cv(new_img_cv, existing_img_cv)
        visual_score = round(img_sim * 30.0, 1)
    else:
        # If no image provided, assign proportional weight based on location + category
        visual_score = 15.0 if (dist_score >= 30 and cat_score > 0) else 5.0

    # 4. Recency score (max 10)
    age_days = (datetime.utcnow() - existing_issue.created_at).days
    if age_days <= 3:
        recency_score = 10.0
    elif age_days <= 7:
        recency_score = 8.0
    elif age_days <= 14:
        recency_score = 5.0
    else:
        recency_score = 2.0

    total_score = round(min(100.0, dist_score + cat_score + visual_score + recency_score), 1)

    breakdown = {
        "location_score": round(dist_score, 1),
        "category_score": round(cat_score, 1),
        "visual_score": round(visual_score, 1),
        "recency_score": round(recency_score, 1),
        "distance_meters": round(dist, 1)
    }

    return total_score, breakdown, dist

def detect_duplicates(
    category: str,
    lat: float,
    lon: float,
    image_cv,
    active_issues: List[Issue],
    threshold: float = 60.0
) -> List[Dict[str, Any]]:
    """
    Checks all unresolved issues and returns duplicate candidates ordered by score.
    """
    matches = []
    for issue in active_issues:
        if issue.status == "Resolved":
            continue

        score, breakdown, dist = evaluate_duplicate_candidate(category, lat, lon, image_cv, issue)
        if score >= threshold or dist <= 45.0:
            matches.append({
                "issue": issue,
                "confidence_score": score,
                "breakdown": breakdown,
                "distance_meters": round(dist, 1)
            })

    matches.sort(key=lambda x: x["confidence_score"], reverse=True)
    return matches
