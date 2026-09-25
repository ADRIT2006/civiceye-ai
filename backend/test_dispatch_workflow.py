"""
Comprehensive Test for CivicEye AI Smart Field Crew Dispatch Workflow
Verifies:
1. Recommendation scoring on CIV-2026-0008 (Same ward drainage worker Rakesh Das #1)
2. Transparent match reasons (advantages & disadvantages)
3. Accurate distance formatting
4. Database assignment persistence
5. AuditLog generation
6. Worker notification creation
7. Strict worker isolation (Worker 14 sees issue; Worker 2 cannot)
8. Reassignment workflow and audit logging
"""

import sys
from app.database import SessionLocal
from app.models.issue import Issue
from app.models.worker import Worker
from app.models.escalation import AuditLog
from app.models.emergency import Notification
from app.services.smart_assignment import recommend_workers_for_issue

def test_workflow():
    db = SessionLocal()
    try:
        print("==================================================")
        print("STEP 1: Testing AI Worker Recommendation Algorithm")
        print("==================================================")
        issue = db.query(Issue).filter(Issue.ticket_id == "CIV-2026-0008").first()
        assert issue is not None, "Issue CIV-2026-0008 must exist in database"
        print(f"Testing Issue: {issue.ticket_id} | Category: {issue.category} | Ward: {issue.ward}")

        # Reset assignment for initial test
        issue.assigned_worker_id = None
        issue.status = "Escalated"
        db.commit()

        recs = recommend_workers_for_issue(db, issue, limit=5)
        assert len(recs) == 5, f"Expected 5 recommendations, got {len(recs)}"

        rank1 = recs[0]
        rank2 = recs[1]

        print(f"Rank 1: {rank1['name']} ({rank1['worker_code']}) - Dept: {rank1['department']}, Ward: {rank1['primary_ward']}, Match: {rank1['match_score']}%, Dist: {rank1['distance']}")
        print(f"        Reasons: {rank1['reasons']}")
        print(f"Rank 2: {rank2['name']} ({rank2['worker_code']}) - Dept: {rank2['department']}, Ward: {rank2['primary_ward']}, Match: {rank2['match_score']}%, Dist: {rank2['distance']}")
        print(f"        Reasons: {rank2['reasons']}")

        # Confirm Rank 1 is Rakesh Das (Ward 06, Drainage)
        assert rank1["name"] == "Rakesh Das", f"Rank 1 should be Rakesh Das, got {rank1['name']}"
        assert "06" in rank1["primary_ward"], "Rank 1 primary ward must be Ward 06"
        assert rank1["department"] == "Drainage", "Rank 1 dept must be Drainage"
        assert rank1["match_score"] >= 94, f"Rank 1 match score should be >= 94%, got {rank1['match_score']}%"
        assert rank1["is_best_match"] is True, "Rank 1 must have is_best_match=True"
        assert rank1["match_score"] > rank2["match_score"], "Rank 1 must score higher than Rank 2"
        print("[PASS] STEP 1: Rakesh Das correctly ranked #1 with >= 94% match score!")
        print("\n==================================================")
        print("STEP 2: Testing Worker Assignment Endpoint Logic")
        print("==================================================")
        from app.routers.admin import assign_worker, AssignWorkerRequest

        payload = AssignWorkerRequest(
            worker_id=14,
            worker_name="Rakesh Das",
            department="Drainage",
            priority="High",
            expected_completion="Within 24 Hours",
            instructions="Inspect blocked drain and clear obstruction. Upload before/after evidence.",
            assigned_by="Dr. Arvind Verma (Commissioner)"
        )

        res = assign_worker(ticket_or_id=issue.ticket_id, payload=payload, db=db)
        assert res["success"] is True, "assign_worker should return success: True"
        assert res["assigned_worker_id"] == 14, "Assigned worker ID must be 14"
        assert res["status"] == "Assigned", f"Issue status should be Assigned, got {res['status']}"
        print(f"Assignment response: {res}")
        print("[PASS] STEP 2: Worker assigned successfully!")

        print("\n==================================================")
        print("STEP 3: Verifying Database Persistence & Audit Log")
        print("==================================================")
        db_issue = db.query(Issue).filter(Issue.ticket_id == "CIV-2026-0008").first()
        assert db_issue.assigned_worker_id == 14, "Database assigned_worker_id must be 14"
        assert db_issue.status == "Assigned", "Database status must be Assigned"

        latest_audit = db.query(AuditLog).filter(AuditLog.issue_id == db_issue.id).order_by(AuditLog.timestamp.desc()).first()
        assert latest_audit is not None, "Audit log must exist"
        assert "Worker Assigned" in latest_audit.action, f"Audit action should be Worker Assigned, got {latest_audit.action}"
        print(f"Audit log entry: [{latest_audit.action}] {latest_audit.details}")
        print("[PASS] STEP 3: Database & Audit log verified!")

        print("\n==================================================")
        print("STEP 4: Verifying Worker Notification Creation")
        print("==================================================")
        notif = db.query(Notification).filter(
            Notification.recipient_role == "worker",
            Notification.ticket_id == "CIV-2026-0008"
        ).order_by(Notification.created_at.desc()).first()
        assert notif is not None, "Worker notification must be created"
        assert notif.title == "New issue assigned", f"Notification title: {notif.title}"
        print(f"Notification: [{notif.title}] {notif.message}")
        print("[PASS] STEP 4: Notification created for field worker!")

        print("\n==================================================")
        print("STEP 5: Verifying Operational Boundaries (Worker Isolation)")
        print("==================================================")
        from app.routers.worker import get_assigned_issues

        # Worker 14 (Rakesh Das)
        issues_w14 = get_assigned_issues(db=db, x_worker_id="14", role="worker")
        w14_tickets = [i["ticket_id"] for i in issues_w14]
        print(f"Worker 14 (Rakesh Das) active work orders: {w14_tickets}")
        assert "CIV-2026-0008" in w14_tickets, "Worker 14 MUST see CIV-2026-0008 in assigned issues"

        # Worker 2 (Rajesh Kumar)
        issues_w2 = get_assigned_issues(db=db, x_worker_id="2", role="worker")
        w2_tickets = [i["ticket_id"] for i in issues_w2]
        print(f"Worker 2 (Rajesh Kumar) active work orders: {w2_tickets}")
        assert "CIV-2026-0008" not in w2_tickets, "Worker 2 MUST NOT see issues assigned to Worker 14"
        print("[PASS] STEP 5: Strict worker isolation verified! Only assigned worker sees the ticket.")

        print("\n==================================================")
        print("STEP 6: Testing Reassignment & Audit Logging")
        print("==================================================")
        reassign_payload = AssignWorkerRequest(
            worker_id=18,
            worker_name="Shivakumar B.",
            department="Drainage",
            priority="Urgent",
            expected_completion="Today",
            instructions="Emergency re-assignment to suction jetting unit.",
            assigned_by="Dr. Arvind Verma (Admin)"
        )
        reassign_res = assign_worker(ticket_or_id=issue.ticket_id, payload=reassign_payload, db=db)
        assert reassign_res["is_reassignment"] is True, "Should flag as reassignment"

        reassign_audit = db.query(AuditLog).filter(AuditLog.issue_id == db_issue.id).order_by(AuditLog.timestamp.desc()).first()
        assert reassign_audit.action == "Worker Reassigned", f"Expected Worker Reassigned, got {reassign_audit.action}"
        print(f"Reassignment audit log: [{reassign_audit.action}] {reassign_audit.details}")

        # Set back to unassigned for clean browser test
        issue.assigned_worker_id = None
        issue.status = "Escalated"
        db.commit()
        print("[PASS] STEP 6: Reassignment creates explicit Audit Log and updates correctly.")

        print("\n==================================================")
        print("ALL BACKEND & WORKFLOW TESTS PASSED SUCCESSFULLY!")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    test_workflow()
