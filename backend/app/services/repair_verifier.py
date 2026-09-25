import os
import uuid
import json
import numpy as np
import cv2
from typing import Dict, Any, Tuple, List
from app.services.image_utils import HEATMAP_DIR, load_image_cv2, compute_dhash, dhash_similarity

def align_and_compare_features(img_before, img_after) -> Tuple[float, float, int, int]:
    """
    Extracts ORB features from Before and After photos, performs Lowe's ratio test matching,
    and runs RANSAC homography to determine inliers.
    Returns: (scene_match_score_0_100, location_match_score_0_100, good_matches_count, inliers_count)
    """
    if img_before is None or img_after is None:
        return 0.0, 0.0, 0, 0

    # Convert to grayscale
    gray1 = cv2.cvtColor(img_before, cv2.COLOR_BGR2GRAY) if len(img_before.shape) == 3 else img_before
    gray2 = cv2.cvtColor(img_after, cv2.COLOR_BGR2GRAY) if len(img_after.shape) == 3 else img_after

    # Standardize size for consistent feature evaluation
    target_size = (640, 480)
    gray1 = cv2.resize(gray1, target_size)
    gray2 = cv2.resize(gray2, target_size)

    # ORB detector
    orb = cv2.ORB_create(nfeatures=1200, scaleFactor=1.2, nlevels=8)
    kp1, des1 = orb.detectAndCompute(gray1, None)
    kp2, des2 = orb.detectAndCompute(gray2, None)

    if des1 is None or des2 is None or len(des1) < 10 or len(des2) < 10:
        return 15.0, 20.0, 0, 0

    # BFMatcher with Hamming distance
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    matches = bf.knnMatch(des1, des2, k=2)

    # Lowe's ratio test
    good_matches = []
    for m_n in matches:
        if len(m_n) == 2:
            m, n = m_n
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

    good_count = len(good_matches)
    if good_count < 8:
        # Extremely low feature correlation = totally different scene/room
        return 12.0, 18.0, good_count, 0

    src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    # Find homography using RANSAC
    H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
    inliers_count = int(np.sum(mask)) if mask is not None else 0

    # Inlier ratio
    inlier_ratio = (inliers_count / float(good_count)) if good_count > 0 else 0.0

    # Scene match score (based on inliers & match density)
    scene_score = min(100.0, max(5.0, (inlier_ratio * 70.0) + min(30.0, (inliers_count / 15.0) * 30.0)))
    
    # Location match score (combines scene with overall structural color/edges)
    dhash1 = compute_dhash(img_before)
    dhash2 = compute_dhash(img_after)
    hash_sim = dhash_similarity(dhash1, dhash2)
    loc_score = min(100.0, max(5.0, (scene_score * 0.65) + (hash_sim * 35.0)))

    return round(scene_score, 1), round(loc_score, 1), good_count, inliers_count

def generate_difference_heatmap(img_before, img_after) -> Tuple[str, float]:
    """
    Computes visual difference map and generates a thermal heatmap overlay.
    Returns: (heatmap_relative_url, defect_change_score_0_100)
    """
    try:
        target_size = (640, 480)
        im1 = cv2.resize(img_before, target_size)
        im2 = cv2.resize(img_after, target_size)

        g1 = cv2.cvtColor(im1, cv2.COLOR_BGR2GRAY)
        g2 = cv2.cvtColor(im2, cv2.COLOR_BGR2GRAY)

        # Gaussian blur to reduce high frequency noise
        b1 = cv2.GaussianBlur(g1, (9, 9), 0)
        b2 = cv2.GaussianBlur(g2, (9, 9), 0)

        diff = cv2.absdiff(b1, b2)
        
        # Focus on center region where repair/defect exists
        h, w = diff.shape
        center_y1, center_y2 = int(h * 0.25), int(h * 0.75)
        center_x1, center_x2 = int(w * 0.25), int(w * 0.75)
        center_diff = diff[center_y1:center_y2, center_x1:center_x2]

        defect_change_magnitude = float(np.mean(center_diff))
        # Scaled 0 to 100
        defect_change_score = min(100.0, max(0.0, defect_change_magnitude * 2.2))

        # Color heatmap
        norm_diff = cv2.normalize(diff, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        heatmap = cv2.applyColorMap(norm_diff, cv2.COLORMAP_JET)

        # Blend with after image
        blended = cv2.addWeighted(im2, 0.65, heatmap, 0.35, 0)

        heatmap_filename = f"diff_{uuid.uuid4().hex[:10]}.jpg"
        full_path = os.path.join(HEATMAP_DIR, heatmap_filename)
        cv2.imwrite(full_path, blended)

        return f"/uploads/heatmaps/{heatmap_filename}", round(defect_change_score, 1)
    except Exception as e:
        return "", 50.0

def verify_repair_cv(before_img_path: str, after_img_path: str) -> Dict[str, Any]:
    """
    Comprehensive AI verification comparing Before and After photos using OpenCV.
    Returns:
    - location_match_score (0-100)
    - scene_match_score (0-100)
    - repair_confidence_score (0-100)
    - suspicion_level ("LOW", "MEDIUM", "HIGH")
    - verification_status ("PASSED", "SUSPICIOUS", "FAILED")
    - failure_reasons (List[str])
    - diagnostic_summary (str)
    - heatmap_url (str)
    """
    img_before = load_image_cv2(before_img_path)
    img_after = load_image_cv2(after_img_path)

    if img_before is None or img_after is None:
        return {
            "location_match_score": 0.0,
            "scene_match_score": 0.0,
            "repair_confidence_score": 0.0,
            "suspicion_level": "HIGH",
            "verification_status": "FAILED",
            "failure_reasons": ["Missing or unreadable repair photograph."],
            "diagnostic_summary": "Verification Failed: Unable to decode input photographs.",
            "heatmap_url": None
        }

    scene_match, loc_match, good_count, inliers = align_and_compare_features(img_before, img_after)
    heatmap_url, defect_delta = generate_difference_heatmap(img_before, img_after)

    failure_reasons = []

    # Check for fake fix scenario: completely different scene (e.g. indoor office or different road)
    if scene_match < 35.0 or loc_match < 35.0:
        suspicion_level = "HIGH"
        verification_status = "FAILED"
        failure_reasons.append("Background Scene Mismatch: RANSAC keypoint inlier ratio is below acceptable physical threshold.")
        failure_reasons.append("Photo appears to be taken at a completely different physical environment or angle.")
        repair_conf = round(min(30.0, scene_match * 0.6), 1)
        diagnostic = (
            f"Suspicious Repair Evidence: Location Match ({loc_match}%) and Scene Match ({scene_match}%) "
            f"indicate this photograph does not match the original issue site. Manual Review Required."
        )
    elif scene_match < 55.0:
        suspicion_level = "MEDIUM"
        verification_status = "SUSPICIOUS"
        failure_reasons.append("Ambiguous Scene Alignment: Moderate feature divergence detected.")
        repair_conf = round(50.0 + (defect_delta * 0.3), 1)
        diagnostic = (
            f"Manual Review Required: Partial physical background match ({scene_match}%), "
            f"but lighting or angle creates ambiguity."
        )
    else:
        # Good scene match! Now evaluate if repair actually took place
        if defect_delta < 8.0:
            # High scene match but zero visual change = worker re-photographed the broken hole!
            suspicion_level = "HIGH"
            verification_status = "FAILED"
            failure_reasons.append("Zero Defect Resolution: Defect area shows virtually no structural modification.")
            repair_conf = 18.0
            diagnostic = "Verification Failed: Scene matches perfectly, but defect appears untouched."
        else:
            # Genuine repair!
            suspicion_level = "LOW"
            verification_status = "PASSED"
            repair_conf = round(min(98.0, 60.0 + (defect_delta * 0.4)), 1)
            diagnostic = (
                f"Repair Verified: High scene consistency ({scene_match}%) and demonstrable physical repair "
                f"delta ({defect_delta}% structural change). Qualified for Community Verification."
            )

    return {
        "location_match_score": loc_match,
        "scene_match_score": scene_match,
        "repair_confidence_score": repair_conf,
        "suspicion_level": suspicion_level,
        "verification_status": verification_status,
        "failure_reasons": failure_reasons,
        "diagnostic_summary": diagnostic,
        "heatmap_url": heatmap_url
    }
