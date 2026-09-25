from app.database import SessionLocal
from app.models.issue import Issue
from app.services.smart_assignment import recommend_workers_for_issue

db = SessionLocal()
issue = db.query(Issue).filter(Issue.ticket_id == 'CIV-2026-0008').first()
recs = recommend_workers_for_issue(db, issue, limit=5)

print(f"Ticket: {issue.ticket_id}, Category: {issue.category}, Ward: {issue.ward}")
print(f"Total returned: {len(recs)}")
for i, r in enumerate(recs):
    print(f"Rank #{i+1}: {r['name']} ({r['worker_code']})")
    print(f"  Dept: {r['department']}, Ward: {r['primary_ward']}, Dist: {r['distance']}")
    print(f"  Match Score: {r['match_score']}%, Best Match: {r['is_best_match']}")
    print(f"  Workload: {r['current_workload']}, Availability: {r['availability']}")
    print(f"  Reasons: {r['reasons']}")
