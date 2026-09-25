import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_all():
    print("--- 1. Testing Health & Docs Endpoints ---")
    res = requests.get(f"{BASE_URL}/docs")
    assert res.status_code == 200, f"/docs failed: {res.status_code}"
    print("[PASS] GET /docs: 200 OK")

    res = requests.get(f"{BASE_URL}/openapi.json")
    assert res.status_code == 200, f"/openapi.json failed: {res.status_code}"
    print("[PASS] GET /openapi.json: 200 OK")

    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"/api/health failed: {res.status_code}"
    data = res.json()
    print("[PASS] GET /api/health: 200 OK ->", json.dumps(data))
    assert data["status"] == "ok"
    assert data["service"] == "CivicEye AI Backend"

    print("\n--- 2. Testing CORS Headers ---")
    res = requests.options(
        f"{BASE_URL}/api/health",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    print(f"[PASS] OPTIONS /api/health CORS: {res.status_code}")
    print("  Access-Control-Allow-Origin:", res.headers.get("access-control-allow-origin"))
    print("  Access-Control-Allow-Credentials:", res.headers.get("access-control-allow-credentials"))
    assert res.headers.get("access-control-allow-origin") == "http://127.0.0.1:5173"
    assert res.headers.get("access-control-allow-credentials") == "true"

    print("\n--- 3. Testing Citizen Endpoints ---")
    # Ward Detection
    res = requests.post(f"{BASE_URL}/api/issues/detect-ward", json={"latitude": 12.9716, "longitude": 77.5946})
    assert res.status_code == 200
    ward_info = res.json()
    print(f"[PASS] POST /api/issues/detect-ward: {ward_info.get('ward_name')}")

    # Citizen Credits
    res = requests.get(f"{BASE_URL}/api/citizen/credits", headers={"X-User-Role": "citizen"})
    assert res.status_code == 200
    credits_data = res.json()
    print(f"[PASS] GET /api/citizen/credits: total={credits_data.get('confirmed_credits')}, pending={credits_data.get('pending_credits')}")

    # Create new issue
    issue_payload = {
        "title": "Severe Pothole Cluster Outside Metro Pillar 44",
        "description": "Deep asphalt trench damaged vehicle axle. Water logged.",
        "category": "Pothole",
        "ward": "Ward 12 - Indiranagar",
        "address": "100 Feet Road, Near Metro Pillar 44",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "reporter_name": "Priya Sharma",
        "reporter_contact": "+91 98451 99881",
        "image_base64": ""
    }
    res = requests.post(f"{BASE_URL}/api/issues", json=issue_payload, headers={"X-User-Role": "citizen"})
    assert res.status_code == 200
    created_issue = res.json()
    new_ticket_id = created_issue["ticket_id"]
    new_issue_id = created_issue["id"]
    print(f"[PASS] POST /api/issues: Created ticket {new_ticket_id} (ID: {new_issue_id})")

    print("\n--- 4. Testing Admin Endpoints ---")
    # Admin Issues
    res = requests.get(f"{BASE_URL}/api/admin/issues", headers={"X-User-Role": "admin"})
    assert res.status_code == 200
    all_admin_issues = res.json()
    print(f"[PASS] GET /api/admin/issues: {len(all_admin_issues)} issues found")

    # Admin Workers
    res = requests.get(f"{BASE_URL}/api/admin/workers", headers={"X-User-Role": "admin"})
    assert res.status_code == 200
    workers = res.json()
    print(f"[PASS] GET /api/admin/workers: {len(workers)} workers registered")
    assert len(workers) >= 20, f"Expected 20-30 workers, found {len(workers)}"

    # Public /api/workers alias
    res = requests.get(f"{BASE_URL}/api/workers")
    assert res.status_code == 200
    alias_workers = res.json()
    print(f"[PASS] GET /api/workers (alias): {len(alias_workers)} workers returned")

    # Smart Recommendation
    res = requests.get(f"{BASE_URL}/api/admin/issues/{new_issue_id}/recommended-workers", headers={"X-User-Role": "admin"})
    assert res.status_code == 200
    recs = res.json()
    print(f"[PASS] GET /api/admin/issues/{new_issue_id}/recommended-workers: {len(recs.get('recommendations', []))} candidates")

    # Assign Worker 5
    res = requests.post(
        f"{BASE_URL}/api/admin/issues/{new_issue_id}/assign",
        json={"worker_id": 5, "worker_name": "Suresh Patel", "department": "Road Maintenance"},
        headers={"X-User-Role": "admin"}
    )
    assert res.status_code == 200
    print(f"[PASS] POST /api/admin/issues/{new_issue_id}/assign (Worker 5): {res.json()}")

    print("\n--- 5. Testing Worker Endpoints ---")
    # Worker issues
    res = requests.get(f"{BASE_URL}/api/worker/issues", headers={"X-User-Role": "worker", "X-Worker-Id": "5"})
    assert res.status_code == 200
    assigned = res.json()
    print(f"[PASS] GET /api/worker/issues (Worker 5): {len(assigned)} work orders assigned")
    assert any(i["id"] == new_issue_id for i in assigned), "Newly assigned issue should be present for worker 5"

    # Worker profile
    res = requests.get(f"{BASE_URL}/api/worker/profile", headers={"X-User-Role": "worker", "X-Worker-Id": "5"})
    assert res.status_code == 200
    print(f"[PASS] GET /api/worker/profile: {res.json().get('name')}")

    print("\n--- 6. Testing AI Copilot Endpoints ---")
    res = requests.post(f"{BASE_URL}/api/copilot/chat", json={"message": "How do I report a pothole in Indiranagar?", "role": "citizen", "language": "en"})
    assert res.status_code == 200
    print(f"[PASS] POST /api/copilot/chat: Response received ({len(res.json().get('reply', ''))} chars)")

    res = requests.post(f"{BASE_URL}/api/copilot/classify-draft", json={"text": "Water pipeline burst causing flood on main road", "language": "en"})
    assert res.status_code == 200
    print(f"[PASS] POST /api/copilot/classify-draft: {res.json().get('suggested_category')}")

    print("\n--- 7. Testing Admin Reports Endpoints ---")
    res = requests.get(f"{BASE_URL}/api/admin/reports/eligible-issues", headers={"X-User-Role": "admin"})
    assert res.status_code == 200
    print(f"[PASS] GET /api/admin/reports/eligible-issues: {len(res.json())} eligible issues")

    res = requests.get(f"{BASE_URL}/api/admin/reports", headers={"X-User-Role": "admin"})
    assert res.status_code == 200
    print(f"[PASS] GET /api/admin/reports: {len(res.json())} generated reports")

    print("\n--- 8. Testing Analytics & GeoJSON ---")
    res = requests.get(f"{BASE_URL}/api/analytics")
    assert res.status_code == 200
    print(f"[PASS] GET /api/analytics: total_issues={res.json().get('total_issues')}")

    res = requests.get(f"{BASE_URL}/api/issues/wards/geojson")
    assert res.status_code == 200
    print(f"[PASS] GET /api/issues/wards/geojson: {len(res.json().get('features', []))} ward polygons")

    print("\n=======================================================")
    print("ALL API ENDPOINT & E2E CHECKS PASSED WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == "__main__":
    test_all()
