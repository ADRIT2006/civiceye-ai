"""
CivicEye AI — Ward Boundary & Point-in-Polygon Service
Architecture:
  coordinates -> point-in-polygon -> official GeoJSON boundary -> ward

Loads official municipal polygons from backend/data/wards.geojson.
If official ward GeoJSON has NOT yet been supplied or the point does not match:
Returns "Ward boundary data unavailable".
Never invents fictional ward polygons or random ward names.
"""

import os
import json
from typing import Dict, List, Optional, Tuple, Any

GEOJSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
    "wards.geojson"
)

def load_official_wards_geojson() -> Dict[str, Any]:
    """Loads official municipal GeoJSON from disk."""
    if not os.path.exists(GEOJSON_PATH):
        return {"type": "FeatureCollection", "features": []}
    try:
        with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict) and data.get("type") == "FeatureCollection":
                return data
            return {"type": "FeatureCollection", "features": []}
    except Exception as e:
        print(f"[WardService] Warning: Failed to parse {GEOJSON_PATH}: {e}")
        return {"type": "FeatureCollection", "features": []}

def get_geojson_feature_collection() -> Dict[str, Any]:
    """Returns the official GeoJSON FeatureCollection for rendering on maps."""
    return load_official_wards_geojson()

def is_point_in_ring(lng: float, lat: float, ring: List[List[float]]) -> bool:
    """Ray casting algorithm to determine if a point (lng, lat) is inside a linear ring."""
    n = len(ring)
    if n < 3:
        return False
    inside = False
    p1x, p1y = ring[0][0], ring[0][1]
    for i in range(1, n + 1):
        p2x, p2y = ring[i % n][0], ring[i % n][1]
        if lat > min(p1y, p2y):
            if lat <= max(p1y, p2y):
                if lng <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    else:
                        xinters = p1x
                    if p1x == p2x or lng <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def is_point_in_polygon_geometry(lng: float, lat: float, geometry: Dict[str, Any]) -> bool:
    """Tests if point is inside a GeoJSON Polygon or MultiPolygon geometry."""
    geom_type = geometry.get("type", "")
    coords = geometry.get("coordinates", [])

    if geom_type == "Polygon":
        if not coords or len(coords) == 0:
            return False
        # Outer ring
        if not is_point_in_ring(lng, lat, coords[0]):
            return False
        # Check interior holes: if inside any hole, then outside the polygon
        for hole in coords[1:]:
            if is_point_in_ring(lng, lat, hole):
                return False
        return True

    elif geom_type == "MultiPolygon":
        for poly_coords in coords:
            if not poly_coords or len(poly_coords) == 0:
                continue
            if is_point_in_ring(lng, lat, poly_coords[0]):
                in_hole = False
                for hole in poly_coords[1:]:
                    if is_point_in_ring(lng, lat, hole):
                        in_hole = True
                        break
                if not in_hole:
                    return True
        return False

    return False

def detect_ward_by_coords(lat: float, lon: float) -> Dict[str, Any]:
    """
    Performs official point-in-polygon verification against municipal GeoJSON.
    If no official match is found or GeoJSON is not loaded:
    Strictly returns 'Ward boundary data unavailable'.
    """
    geojson = load_official_wards_geojson()
    features = geojson.get("features", [])

    for feature in features:
        geometry = feature.get("geometry")
        properties = feature.get("properties", {})
        if geometry and is_point_in_polygon_geometry(lon, lat, geometry):
            ward_name = properties.get("name") or properties.get("ward_name") or f"Ward {properties.get('id', '')}".strip()
            ward_id = properties.get("id") or properties.get("ward_id") or properties.get("ward_no")
            zone = properties.get("zone") or properties.get("zone_name") or "Municipal Sector"
            return {
                "ward_id": str(ward_id) if ward_id is not None else None,
                "ward_name": ward_name,
                "zone": zone,
                "is_detected": True
            }

    # If official boundary data is not provided or point is outside verified boundaries:
    return {
        "ward_id": None,
        "ward_name": "Ward boundary data unavailable",
        "zone": "Unavailable",
        "is_detected": False
    }

def get_loaded_ward_polygons() -> List[Dict[str, Any]]:
    """Helper to expose features in list format for compatibility with assignment centroid calculations."""
    geojson = load_official_wards_geojson()
    result = []
    for f in geojson.get("features", []):
        props = f.get("properties", {})
        geom = f.get("geometry", {})
        coords = []
        if geom.get("type") == "Polygon" and geom.get("coordinates"):
            coords = geom["coordinates"][0]
        elif geom.get("type") == "MultiPolygon" and geom.get("coordinates"):
            coords = geom["coordinates"][0][0]
        result.append({
            "id": str(props.get("id", "")),
            "name": props.get("name") or props.get("ward_name", "Ward"),
            "zone": props.get("zone", "Zone"),
            "color": props.get("color", "#3b82f6"),
            "coordinates": coords
        })
    return result

# Backward compatibility reference
WARD_POLYGONS = get_loaded_ward_polygons()
