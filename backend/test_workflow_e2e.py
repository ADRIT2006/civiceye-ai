import requests
import json
import base64
import time
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def run_test():
    print("=" * 60)
    print("CIVICEYE AI — END-TO-END WORKFLOW INTEGRATION TEST")
    print("=" * 60)

    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    assert health_data["status"] == "ok"
    assert health_data["service"] == "CivicEye AI"
    print(f"[PASS] 1. Backend Health: {health_data}")

    # Generate small 1x1 sample PNG base64 for repair upload
    sample_png_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    # 2. Citizen Reports Issue
    citizen_headers = {"X-User-Role": "citizen", "X-User-Name": "Priya Sharma"}
    report_payload = {
        "title": "Severe Pothole Cluster Outside Metro Pillar 45",
        "description": "Deep asphalt trench damaged vehicle axle. Road hazardous during rain.",
        "category": "Pothole",
        "ward": "Ward 12 - Indiranagar",
        "address": "100 Feet Road, Near Metro Pillar 45",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "reporter_name": "Priya Sharma",
        "reporter_contact": "+91 98451 99881",
        "image_base64": sample_png_b64
    }
    res = requests.post(f"{BASE_URL}/api/issues", json=report_payload, headers=citizen_headers)
    assert res.status_code == 200, f"Create issue failed: {res.text}"
    issue_data = res.json()
    issue_id = issue_data["id"]
    ticket_id = issue_data["ticket_id"]
    assert issue_data["status"] == "REPORTED"
    print(f"[PASS] 2. Citizen Reports Issue: Created {ticket_id} (ID: {issue_id}) with status {issue_data['status']}")

    # 3. Admin Receives Issue in Issue List
    admin_headers = {"X-User-Role": "admin", "X-User-Name": "Dr. Arvind Verma"}
    res = requests.get(f"{BASE_URL}/api/admin/issues", headers=admin_headers)
    assert res.status_code == 200
    admin_issues = res.json()
    found_issue = next((i for i in admin_issues if i["ticket_id"] == ticket_id), None)
    assert found_issue is not None, f"Issue {ticket_id} not found in admin issue list"
    assert found_issue["status"] == "REPORTED"
    print(f"[PASS] 3. Admin Receives Issue: {ticket_id} visible in Admin Dashboard with status REPORTED")

    # 4. Admin Assigns Worker
    assign_payload = {
        "worker_id": 2,
        "worker_name": "Rajesh Kumar",
        "department": "Road Maintenance",
        "priority": "Critical",
        "expected_completion": "Within 24 Hours",
        "instructions": "Use hot-mix bitumen compaction on-site immediately."
    }
    res = requests.post(f"{BASE_URL}/api/admin/issues/{ticket_id}/assign", json=assign_payload, headers=admin_headers)
    assert res.status_code == 200, f"Assign failed: {res.text}"
    assign_res = res.json()
    assert assign_res["assigned_worker_id"] == 2
    assert assign_res["status"] == "ASSIGNED"
    print(f"[PASS] 4. Admin Assigns Worker: {ticket_id} assigned to Worker 2 (Rajesh Kumar), status ASSIGNED")

    # 5. Worker Receives Task
    worker_headers = {"X-User-Role": "worker", "X-Worker-Id": "2", "X-User-Name": "Rajesh Kumar"}
    res = requests.get(f"{BASE_URL}/api/worker/assigned", headers=worker_headers)
    assert res.status_code == 200
    worker_tasks = res.json()
    worker_task = next((t for t in worker_tasks if t["ticket_id"] == ticket_id), None)
    assert worker_task is not None, f"Task {ticket_id} not in Worker 2 queue"
    assert worker_task["status"] == "ASSIGNED"
    print(f"[PASS] 5. Worker Receives Task: {ticket_id} appears in Worker 2's Assigned Tasks")

    # Worker 403 Forbidden Security Verification: Worker 3 (Amit Roy) cannot access Worker 2's task
    worker3_headers = {"X-User-Role": "worker", "X-Worker-Id": "3", "X-User-Name": "Amit Roy"}
    res_forbidden = requests.get(f"{BASE_URL}/api/worker/issues/{ticket_id}", headers=worker3_headers)
    assert res_forbidden.status_code == 403, f"Expected 403 for Worker 3, got: {res_forbidden.status_code}"
    print(f"[PASS] 5b. Worker Authorization (403): Worker 3 blocked from accessing Worker 2's task")

    # 6. Worker Starts Work
    res = requests.post(f"{BASE_URL}/api/worker/issues/{issue_id}/start-work", headers=worker_headers)
    assert res.status_code == 200, f"Start work failed: {res.text}"
    start_data = res.json()
    assert start_data["status"] == "IN_PROGRESS"
    assert "work_started_at" in start_data
    print(f"[PASS] 6. Worker Starts Work: Status updated to IN_PROGRESS at {start_data['work_started_at']}")

    # 7. Worker Completes Work + Uploads Evidence
    repair_payload = {
        "worker_name": "Rajesh Kumar",
        "repair_notes": "Pothole filled and road surface levelled with bitumen asphalt patch.",
        "materials_used": "Cold-mix bitumen, aggregate compaction",
        "after_image_base64": sample_png_b64
    }
    # Test worker specific endpoint POST /api/worker/issues/{id}/repair
    res = requests.post(f"{BASE_URL}/api/worker/issues/{issue_id}/repair", json=repair_payload, headers=worker_headers)
    assert res.status_code == 200, f"Submit repair failed: {res.text}"
    repair_res = res.json()
    assert repair_res["new_status"] == "AWAITING_CITIZEN_VERIFICATION"
    print(f"[PASS] 7. Worker Completes Work: Repair submitted, status moved to AWAITING_CITIZEN_VERIFICATION")

    # 8. Citizen Receives Verification Request
    res = requests.get(f"{BASE_URL}/api/issues/{ticket_id}", headers=citizen_headers)
    assert res.status_code == 200
    details = res.json()
    assert details["status"] == "AWAITING_CITIZEN_VERIFICATION"
    assert details["after_image_url"] is not None
    assert details["worker_completion_note"] == "Pothole filled and road surface levelled with bitumen asphalt patch."
    print(f"[PASS] 8. Citizen Receives Verification: {ticket_id} shows After Photo and Worker Note")

    # 9. Citizen Confirms Fixed -> RESOLVED
    verify_payload = {
        "verified": True,
        "citizen_name": "Priya Sharma"
    }
    res = requests.post(f"{BASE_URL}/api/issues/{issue_id}/citizen-verify", json=verify_payload, headers=citizen_headers)
    assert res.status_code == 200, f"Citizen verify failed: {res.text}"
    verify_res = res.json()
    assert verify_res["status"] == "RESOLVED"
    assert verify_res["citizen_verified"] is True
    print(f"[PASS] 9. Citizen Confirms Fixed: Status permanently updated to RESOLVED")

    # Verify Civic Credits Awarded
    res = requests.get(f"{BASE_URL}/api/citizen/credits", headers=citizen_headers)
    assert res.status_code == 200
    credits_data = res.json()
    assert credits_data["confirmed_credits"] >= 10
    print(f"[PASS] 9b. Civic Credits Awarded: Confirmed Credits = {credits_data['confirmed_credits']}")

    # 10. Admin Generates Work Completion Report
    res = requests.post(f"{BASE_URL}/api/admin/reports/generate/{ticket_id}", headers=admin_headers)
    assert res.status_code == 200, f"Generate report failed: {res.text}"
    report = res.json()
    assert report["ticket_id"] == ticket_id
    assert report["final_status"] == "RESOLVED"
    assert report["worker_name"] == "Rajesh Kumar"
    assert report["date_reported"] is not None
    assert report["date_assigned"] is not None
    assert report["date_started"] is not None
    assert report["date_completed"] is not None
    assert report["before_image_url"] is not None
    assert report["after_image_url"] is not None
    print(f"[PASS] 10. Admin Final Report: Generated report {report['report_id']} with all timestamps, before/after photos, and worker notes")

    # 11. Citizen Rejection / Reopen Test Flow
    print("\n--- Testing Citizen Rejection / Reopen Flow ---")
    res2 = requests.post(f"{BASE_URL}/api/issues", json={
        "title": "Broken Streetlight Mast",
        "description": "Exposed live wiring hanging near pedestrian footpath.",
        "category": "Broken Streetlight",
        "ward": "Ward 04 - Koramangala",
        "address": "80 Feet Road, Koramangala",
        "latitude": 12.9352,
        "longitude": 77.6245,
        "reporter_name": "Priya Sharma",
        "image_base64": sample_png_b64
    }, headers=citizen_headers)
    issue2_id = res2.json()["id"]
    ticket2_id = res2.json()["ticket_id"]

    # Assign & Start & Complete
    requests.post(f"{BASE_URL}/api/admin/issues/{ticket2_id}/assign", json={"worker_id": 3, "worker_name": "Amit Roy", "department": "Electrical"}, headers=admin_headers)
    w3_headers = {"X-User-Role": "worker", "X-Worker-Id": "3", "X-User-Name": "Amit Roy"}
    requests.post(f"{BASE_URL}/api/worker/issues/{issue2_id}/start-work", headers=w3_headers)
    requests.post(f"{BASE_URL}/api/worker/issues/{issue2_id}/repair", json={
        "worker_name": "Amit Roy",
        "repair_notes": "Wiring taped and pushed into pole base.",
        "after_image_base64": sample_png_b64
    }, headers=w3_headers)

    # Citizen Rejects Repair
    reject_payload = {
        "verified": False,
        "reason": "Exposed cable is still dangling outside the pole cover.",
        "citizen_name": "Priya Sharma"
    }
    res_reject = requests.post(f"{BASE_URL}/api/issues/{issue2_id}/citizen-verify", json=reject_payload, headers=citizen_headers)
    assert res_reject.status_code == 200
    reject_res = res_reject.json()
    assert reject_res["status"] == "REOPENED"
    assert reject_res["citizen_verified"] is False
    print(f"[PASS] 11. Citizen Rejection: Ticket {ticket2_id} moved to REOPENED with reason saved")

    # 12. Database Persistence Check via direct SQLite query
    print("\n--- Testing Database Persistence (Direct SQLite Verification) ---")
    from app.database import SessionLocal
    from app.models.issue import Issue
    from app.models.escalation import AuditLog
    from app.models.report import GeneratedReport
    db = SessionLocal()
    try:
        db_issue = db.query(Issue).filter(Issue.ticket_id == ticket_id).first()
        assert db_issue is not None
        assert db_issue.status == "RESOLVED"
        assert db_issue.citizen_verified is True
        assert db_issue.work_started_at is not None
        assert db_issue.work_completed_at is not None
        assert db_issue.assigned_at is not None
        assert db_issue.worker_completion_note is not None
        
        # Verify audit logs
        logs = db.query(AuditLog).filter(AuditLog.issue_id == db_issue.id).all()
        log_actions = [l.action for l in logs]
        print(f"  Audit Trail Log Actions: {log_actions}")
        assert any("Worker Assigned" in a for a in log_actions)
        assert any("Work Started" in a for a in log_actions)
        assert any("Work Completed" in a for a in log_actions)
        assert any("Citizen Verified Fixed" in a for a in log_actions)

        # Verify generated report
        db_report = db.query(GeneratedReport).filter(GeneratedReport.ticket_id == ticket_id).first()
        assert db_report is not None
        print(f"  Database Report: {db_report.report_id} | Final Status: {db_report.final_status}")

        print("[PASS] 12. Database Persistence: All state transitions, timestamps, audit logs, and reports fully persisted in SQLite!")
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("ALL 12 END-TO-END WORKFLOW INTEGRATION CHECKS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    run_test()
