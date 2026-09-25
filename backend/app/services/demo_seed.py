import os
import random
from datetime import datetime, timedelta
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.issue import Issue, IssueReport, IssueImage
from app.models.verification import RepairSubmission, AiVerification, CommunityVerification
from app.models.escalation import Escalation, MunicipalContact, AuditLog
from app.models.emergency import EmergencyContact, Notification
from app.models.worker import Worker
from app.models.credits import CreditTransaction
from app.models.report import GeneratedReport
from app.services.image_utils import BEFORE_DIR, AFTER_DIR, HEATMAP_DIR
from app.services.priority_engine import calculate_priority_score
from app.services.repair_verifier import verify_repair_cv

# Helper to generate procedural civic textures using PIL
def create_synthetic_civic_image(
    filename: str,
    folder: str,
    issue_type: str,
    is_repaired: bool = False,
    is_fake_fix: bool = False
) -> str:
    """Generates procedural high-resolution civic infrastructure photos."""
    target_dir = BEFORE_DIR if folder == "before" else AFTER_DIR
    full_path = os.path.join(target_dir, filename)
    
    if os.path.exists(full_path):
        return f"/uploads/{folder}/{filename}"

    width, height = 640, 480
    img = Image.new("RGB", (width, height), (70, 72, 75))
    draw = ImageDraw.Draw(img)

    # 1. Base asphalt or background texture
    if is_fake_fix:
        # Generate indoor tile floor (completely mismatched scene)
        img = Image.new("RGB", (width, height), (220, 215, 205))
        draw = ImageDraw.Draw(img)
        tile_size = 80
        for x in range(0, width, tile_size):
            draw.line([(x, 0), (x, height)], fill=(180, 175, 165), width=3)
        for y in range(0, height, tile_size):
            draw.line([(0, y), (width, y)], fill=(180, 175, 165), width=3)
        # Add label watermark
        draw.text((20, 20), "OFFICE FLOOR MOCK FIX (AI FLAG TARGET)", fill=(150, 40, 40))
        img.save(full_path, "JPEG", quality=90)
        return f"/uploads/{folder}/{filename}"

    # Asphalt background with noise
    asphalt_base = np.random.randint(55, 85, (height, width, 3), dtype=np.uint8)
    img = Image.fromarray(asphalt_base)
    draw = ImageDraw.Draw(img)

    # Road curb / lane markings
    draw.line([(0, 40), (width, 40)], fill=(230, 230, 230), width=6)
    draw.line([(0, height - 30), (width, height - 30)], fill=(220, 180, 30), width=8)

    center_x, center_y = width // 2, height // 2

    if is_repaired:
        # Fresh smooth dark asphalt patch over defect area
        draw.ellipse([center_x - 140, center_y - 90, center_x + 140, center_y + 90], fill=(35, 36, 38))
        draw.line([center_x - 120, center_y - 20, center_x + 120, center_y + 20], fill=(50, 52, 55), width=4)
        draw.text((center_x - 70, center_y - 10), "FRESH ASPHALT PATCH", fill=(100, 105, 110))
    else:
        # Defect depiction based on type
        if "pothole" in issue_type.lower():
            # Deep crater with jagged edges and loose gravel
            draw.ellipse([center_x - 120, center_y - 80, center_x + 120, center_y + 80], fill=(25, 20, 15))
            draw.ellipse([center_x - 90, center_y - 60, center_x + 90, center_y + 60], fill=(15, 12, 10))
            # Crack lines
            draw.line([center_x - 120, center_y, center_x - 170, center_y - 40], fill=(15, 15, 15), width=3)
            draw.line([center_x + 110, center_y + 20, center_x + 160, center_y + 50], fill=(15, 15, 15), width=3)
        elif "drain" in issue_type.lower():
            # Open dark trench / broken iron grating
            draw.rectangle([center_x - 130, center_y - 70, center_x + 130, center_y + 70], fill=(15, 18, 20))
            # Broken bars
            for bx in range(center_x - 110, center_x + 120, 35):
                draw.line([(bx, center_y - 65), (bx + 10, center_y - 15)], fill=(120, 110, 100), width=6)
        elif "garbage" in issue_type.lower():
            # Waste accumulation mounds
            draw.ellipse([center_x - 130, center_y - 60, center_x + 110, center_y + 70], fill=(90, 80, 50))
            draw.ellipse([center_x - 80, center_y - 40, center_x + 70, center_y + 50], fill=(70, 95, 60))
            draw.ellipse([center_x - 30, center_y - 80, center_x + 50, center_y + 10], fill=(120, 110, 80))
        elif "water" in issue_type.lower():
            # Water leakage ponding
            draw.ellipse([center_x - 140, center_y - 80, center_x + 140, center_y + 80], fill=(45, 80, 110))
            draw.ellipse([center_x - 100, center_y - 50, center_x + 90, center_y + 50], fill=(60, 110, 145))
        elif "streetlight" in issue_type.lower():
            # Broken lamp pole base in darkness
            draw.rectangle([0, 0, width, height], fill=(20, 22, 28))
            draw.line([(center_x, 40), (center_x, height - 40)], fill=(110, 115, 120), width=14)
            draw.ellipse([center_x - 35, 30, center_x + 35, 75], fill=(60, 60, 65))
        else:
            # Road damage / fissured asphalt
            for i in range(5):
                draw.line([(center_x - 150 + i * 60, center_y - 70), (center_x - 120 + i * 60, center_y + 70)], fill=(20, 20, 20), width=4)

    # Save to uploads
    img.save(full_path, "JPEG", quality=88)
    return f"/uploads/{folder}/{filename}"

def seed_emergency_and_notifications(db: Session):
    """Ensures emergency contacts and role notifications are seeded."""
    if not db.query(EmergencyContact).first():
        print("[CivicEye AI] Seeding jurisdiction emergency contact directory...")
        contacts = [
            EmergencyContact(
                service_name="Emergency Response Support System (ERSS)",
                phone_number="112",
                description="Unified national emergency response helpline for Police, Fire, Ambulance & Disaster services.",
                category="emergency",
                is_primary=True,
                active=True
            ),
            EmergencyContact(
                service_name="Police Control Room",
                phone_number="100",
                description="Immediate law enforcement, crime incident response, and civic security intervention.",
                category="police",
                is_primary=False,
                active=True
            ),
            EmergencyContact(
                service_name="Fire & Rescue Services",
                phone_number="101",
                description="Fire hazards, structural collapse, chemical spills, and heavy rescue operations.",
                category="fire",
                is_primary=False,
                active=True
            ),
            EmergencyContact(
                service_name="Ambulance & Emergency Medical",
                phone_number="102",
                description="Critical medical emergencies, ambulance dispatch, trauma response and hospital coordination.",
                category="medical",
                is_primary=False,
                active=True
            ),
            EmergencyContact(
                service_name="Women Helpline (All-India)",
                phone_number="1091",
                description="24x7 dedicated emergency assistance, crisis counseling, and safety support for women.",
                category="helpline",
                is_primary=False,
                active=True
            ),
            EmergencyContact(
                service_name="Child Helpline (Childline India)",
                phone_number="1098",
                description="24-hour free emergency phone service for children in need of care and protection.",
                category="helpline",
                is_primary=False,
                active=True
            ),
        ]
        for c in contacts:
            db.add(c)
        db.commit()

    if not db.query(Notification).first():
        print("[CivicEye AI] Seeding role-specific notification queue...")
        now = datetime.utcnow()
        notifications = [
            # Citizen notifications
            Notification(
                recipient_role="citizen",
                title="Complaint Acknowledged",
                message="Your complaint CIV-2026-0007 has been acknowledged by Ward 12 Municipal Office.",
                category="alert",
                ticket_id="CIV-2026-0007",
                is_read=False,
                created_at=now - timedelta(hours=50)
            ),
            Notification(
                recipient_role="citizen",
                title="Duplicate Report Merged",
                message="Your report was merged with existing master issue CIV-2026-0007 (High similarity detected).",
                category="duplicate",
                ticket_id="CIV-2026-0007",
                is_read=False,
                created_at=now - timedelta(hours=42)
            ),
            Notification(
                recipient_role="citizen",
                title="Community Verification Requested",
                message="Repair submitted for CIV-2026-0002 — community verification requested in Ward 04.",
                category="verification",
                ticket_id="CIV-2026-0002",
                is_read=False,
                created_at=now - timedelta(hours=3)
            ),
            Notification(
                recipient_role="citizen",
                title="Complaint Resolved",
                message="Your complaint CIV-2026-0004 has been resolved and verified by 2 local residents.",
                category="resolved",
                ticket_id="CIV-2026-0004",
                is_read=True,
                created_at=now - timedelta(hours=14)
            ),
            # Worker notifications
            Notification(
                recipient_role="worker",
                title="New Critical Issue Assigned",
                message="New critical issue CIV-2026-0007 assigned to Ward 12 Road Crew.",
                category="assignment",
                ticket_id="CIV-2026-0007",
                is_read=False,
                created_at=now - timedelta(hours=40)
            ),
            Notification(
                recipient_role="worker",
                title="Inspection Required",
                message="CIV-2026-0007 must be inspected on-site before 48h SLA deadline.",
                category="alert",
                ticket_id="CIV-2026-0007",
                is_read=False,
                created_at=now - timedelta(hours=12)
            ),
            Notification(
                recipient_role="worker",
                title="Evidence Resubmission Needed",
                message="Repair evidence for CIV-2026-0003 requires another photograph with clear road landmarks.",
                category="verification",
                ticket_id="CIV-2026-0003",
                is_read=False,
                created_at=now - timedelta(hours=5)
            ),
            # Admin notifications
            Notification(
                recipient_role="admin",
                title="Critical Complaint Assignment Needed",
                message="Critical complaint CIV-2026-0007 requires immediate crew dispatch.",
                category="assignment",
                ticket_id="CIV-2026-0007",
                is_read=False,
                created_at=now - timedelta(hours=48)
            ),
            Notification(
                recipient_role="admin",
                title="Statutory Escalation Triggered",
                message="Complaint CIV-2026-0007 automatically escalated after 48h SLA breach. Level 1 Notice dispatched.",
                category="escalation",
                ticket_id="CIV-2026-0007",
                is_read=False,
                created_at=now - timedelta(hours=3)
            ),
            Notification(
                recipient_role="admin",
                title="Manual Review Required",
                message="Repair evidence for CIV-2026-0007 flagged SUSPICIOUS (12% scene match). AI recommends admin inspection.",
                category="review",
                ticket_id="CIV-2026-0007",
                is_read=False,
                created_at=now - timedelta(hours=1)
            ),
            Notification(
                recipient_role="admin",
                title="Emergency Civic Hazard Reported",
                message="Emergency civic hazard reported in Ward 04: Exposed High-Voltage Line near junction.",
                category="emergency",
                ticket_id="CIV-2026-0001",
                is_read=False,
                created_at=now - timedelta(minutes=45)
            ),
        ]
        for n in notifications:
            db.add(n)
        db.commit()

def seed_workers(db: Session):
    """Populates 25 realistic municipal workers across all departments and wards."""
    if db.query(Worker).first():
        return

    workers_data = [
        {
            "id": 1, "worker_code": "WRK-2026-001", "name": "Rahul Das",
            "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98450 11001", "department": "Road Maintenance",
            "specialization": "Heavy Bitumen Patching & Roller Compaction",
            "primary_ward": "Ward 12 - Indiranagar", "secondary_wards": "Ward 10 - MG Road, Ward 13 - Domlur",
            "availability": "Available", "current_workload": 2, "completed_jobs": 52,
            "avg_resolution_hours": 21.4, "rating": 4.9, "sla_compliance_pct": 96.2, "status": "Active"
        },
        {
            "id": 2, "worker_code": "WRK-2026-002", "name": "Rajesh Kumar",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98765 11223", "department": "Road Maintenance",
            "specialization": "Asphalt Milling & Pothole Remediation",
            "primary_ward": "Ward 12 - Indiranagar", "secondary_wards": "Ward 04 - Koramangala",
            "availability": "Working", "current_workload": 3, "completed_jobs": 48,
            "avg_resolution_hours": 19.8, "rating": 4.8, "sla_compliance_pct": 94.5, "status": "Active"
        },
        {
            "id": 3, "worker_code": "WRK-2026-003", "name": "Amit Roy",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98451 22002", "department": "Electrical",
            "specialization": "LED Luminaire Drivers & High-Voltage Cabling",
            "primary_ward": "Ward 07 - BTM Layout", "secondary_wards": "Ward 08 - Jayanagar",
            "availability": "Available", "current_workload": 1, "completed_jobs": 42,
            "avg_resolution_hours": 16.2, "rating": 4.9, "sla_compliance_pct": 98.0, "status": "Active"
        },
        {
            "id": 4, "worker_code": "WRK-2026-004", "name": "Suresh Babu",
            "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98452 33003", "department": "Water Supply",
            "specialization": "Underground Main Pipeline Breach & Joint Welding",
            "primary_ward": "Ward 04 - Koramangala", "secondary_wards": "Ward 05 - HSR Layout",
            "availability": "Working", "current_workload": 4, "completed_jobs": 58,
            "avg_resolution_hours": 24.5, "rating": 4.7, "sla_compliance_pct": 92.8, "status": "Active"
        },
        {
            "id": 5, "worker_code": "WRK-2026-005", "name": "Manjunath Gowda",
            "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98453 44004", "department": "Drainage",
            "specialization": "Precast Concrete Slabs & Culvert De-silting",
            "primary_ward": "Ward 01 - Majestic", "secondary_wards": "Ward 03 - Rajajinagar",
            "availability": "Available", "current_workload": 1, "completed_jobs": 39,
            "avg_resolution_hours": 22.1, "rating": 4.6, "sla_compliance_pct": 95.0, "status": "Active"
        },
        {
            "id": 6, "worker_code": "WRK-2026-006", "name": "Ramesh Chandra",
            "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98454 55005", "department": "Sanitation",
            "specialization": "Solid Waste Clearance & Compactor Operations",
            "primary_ward": "Ward 08 - Jayanagar", "secondary_wards": "Ward 06 - Basavanagudi",
            "availability": "Available", "current_workload": 2, "completed_jobs": 65,
            "avg_resolution_hours": 14.8, "rating": 4.8, "sla_compliance_pct": 97.4, "status": "Active"
        },
        {
            "id": 7, "worker_code": "WRK-2026-007", "name": "Vijay Anand",
            "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98455 66006", "department": "Parks & Trees",
            "specialization": "Hazardous Arboriculture & Hydraulic Lift Clearing",
            "primary_ward": "Ward 10 - MG Road", "secondary_wards": "Ward 12 - Indiranagar",
            "availability": "Available", "current_workload": 0, "completed_jobs": 31,
            "avg_resolution_hours": 18.0, "rating": 4.9, "sla_compliance_pct": 99.1, "status": "Active"
        },
        {
            "id": 8, "worker_code": "WRK-2026-008", "name": "Deepak Sharma",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98456 77007", "department": "Emergency Maintenance",
            "specialization": "Structural Collapse & High-Voltage Hazard Neutralization",
            "primary_ward": "Ward 12 - Indiranagar", "secondary_wards": "Citywide Emergency Response",
            "availability": "Available", "current_workload": 1, "completed_jobs": 34,
            "avg_resolution_hours": 8.5, "rating": 5.0, "sla_compliance_pct": 100.0, "status": "Active"
        },
        {
            "id": 9, "worker_code": "WRK-2026-009", "name": "Mohammed Rafiq",
            "avatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98457 88008", "department": "Public Infrastructure",
            "specialization": "Pedestrian Kerbs, Bollards & Crash Barriers",
            "primary_ward": "Ward 06 - Basavanagudi", "secondary_wards": "Ward 17 - Banashankari",
            "availability": "Available", "current_workload": 2, "completed_jobs": 44,
            "avg_resolution_hours": 26.0, "rating": 4.7, "sla_compliance_pct": 94.0, "status": "Active"
        },
        {
            "id": 10, "worker_code": "WRK-2026-010", "name": "Sunil Patil",
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98458 99009", "department": "Road Maintenance",
            "specialization": "Trench Restorations & Cold Bitumen Mix",
            "primary_ward": "Ward 02 - Malleshwaram", "secondary_wards": "Ward 01 - Majestic",
            "availability": "Working", "current_workload": 3, "completed_jobs": 41,
            "avg_resolution_hours": 23.4, "rating": 4.6, "sla_compliance_pct": 93.1, "status": "Active"
        },
        {
            "id": 11, "worker_code": "WRK-2026-011", "name": "Karthik Narayan",
            "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98459 10010", "department": "Electrical",
            "specialization": "High-Mast Mast Light Wiring & Phase Balancing",
            "primary_ward": "Ward 03 - Rajajinagar", "secondary_wards": "Ward 18 - Vijayanagar",
            "availability": "Available", "current_workload": 1, "completed_jobs": 46,
            "avg_resolution_hours": 15.5, "rating": 4.8, "sla_compliance_pct": 97.2, "status": "Active"
        },
        {
            "id": 12, "worker_code": "WRK-2026-012", "name": "Anand Kulkarni",
            "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98460 11011", "department": "Water Supply",
            "specialization": "Acoustic Leak Detection & Pressure Regulation",
            "primary_ward": "Ward 05 - HSR Layout", "secondary_wards": "Ward 07 - BTM Layout",
            "availability": "Available", "current_workload": 2, "completed_jobs": 53,
            "avg_resolution_hours": 20.8, "rating": 4.8, "sla_compliance_pct": 96.0, "status": "Active"
        },
        {
            "id": 13, "worker_code": "WRK-2026-013", "name": "Venkatesh Prasad",
            "avatar": "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98461 12012", "department": "Drainage",
            "specialization": "Deep Manhole Reconstruction & Sluice Gates",
            "primary_ward": "Ward 13 - Domlur", "secondary_wards": "Ward 12 - Indiranagar",
            "availability": "Off Duty", "current_workload": 0, "completed_jobs": 29,
            "avg_resolution_hours": 25.1, "rating": 4.5, "sla_compliance_pct": 91.0, "status": "Active"
        },
        {
            "id": 14, "worker_code": "WRK-2026-014", "name": "Rakesh Das",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98462 13014", "department": "Drainage",
            "specialization": "Stormwater Drains, Culvert Desilting & Sump Pumps",
            "primary_ward": "Ward 06 - Basavanagudi", "secondary_wards": "Ward 17 - Banashankari, Ward 08 - Jayanagar",
            "availability": "Available", "current_workload": 1, "completed_jobs": 59,
            "avg_resolution_hours": 16.0, "rating": 4.9, "sla_compliance_pct": 98.5, "status": "Active"
        },
        {
            "id": 15, "worker_code": "WRK-2026-015", "name": "Prakash Nair",
            "avatar": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98463 14014", "department": "Road Maintenance",
            "specialization": "Concrete Pavements & Median Kerb Repairs",
            "primary_ward": "Ward 15 - Hebbal", "secondary_wards": "Ward 16 - Yelahanka",
            "availability": "Available", "current_workload": 1, "completed_jobs": 36,
            "avg_resolution_hours": 27.2, "rating": 4.7, "sla_compliance_pct": 94.8, "status": "Active"
        },
        {
            "id": 16, "worker_code": "WRK-2026-016", "name": "Chetan Kumar",
            "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98464 15015", "department": "Electrical",
            "specialization": "Overhead Line Re-stringing & Earthing",
            "primary_ward": "Ward 16 - Yelahanka", "secondary_wards": "Ward 15 - Hebbal",
            "availability": "On Leave", "current_workload": 0, "completed_jobs": 24,
            "avg_resolution_hours": 21.0, "rating": 4.6, "sla_compliance_pct": 92.0, "status": "Inactive"
        },
        {
            "id": 17, "worker_code": "WRK-2026-017", "name": "Harish Rao",
            "avatar": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98465 16016", "department": "Water Supply",
            "specialization": "Submersible Pumps & Chlorination Feeders",
            "primary_ward": "Ward 17 - Banashankari", "secondary_wards": "Ward 06 - Basavanagudi",
            "availability": "Working", "current_workload": 4, "completed_jobs": 51,
            "avg_resolution_hours": 25.4, "rating": 4.7, "sla_compliance_pct": 93.5, "status": "Active"
        },
        {
            "id": 18, "worker_code": "WRK-2026-018", "name": "Shivakumar B.",
            "avatar": "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98466 17017", "department": "Drainage",
            "specialization": "Suction Jetting Units & Underground Sump Clearing",
            "primary_ward": "Ward 18 - Vijayanagar", "secondary_wards": "Ward 03 - Rajajinagar",
            "availability": "Available", "current_workload": 2, "completed_jobs": 40,
            "avg_resolution_hours": 19.5, "rating": 4.8, "sla_compliance_pct": 96.0, "status": "Active"
        },
        {
            "id": 19, "worker_code": "WRK-2026-019", "name": "Nitin Joshi",
            "avatar": "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98467 18018", "department": "Sanitation",
            "specialization": "Litter Boom Maintenance & Wet Waste Collection",
            "primary_ward": "Ward 19 - Bellandur", "secondary_wards": "Ward 05 - HSR Layout",
            "availability": "Available", "current_workload": 1, "completed_jobs": 45,
            "avg_resolution_hours": 15.0, "rating": 4.9, "sla_compliance_pct": 97.9, "status": "Active"
        },
        {
            "id": 20, "worker_code": "WRK-2026-020", "name": "Raghavendra S.",
            "avatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98468 19019", "department": "Public Infrastructure",
            "specialization": "Road Signage, Reflective Cats-Eyes & Railings",
            "primary_ward": "Ward 20 - Kalyan Nagar", "secondary_wards": "Ward 02 - Malleshwaram",
            "availability": "Available", "current_workload": 0, "completed_jobs": 33,
            "avg_resolution_hours": 28.0, "rating": 4.7, "sla_compliance_pct": 95.5, "status": "Active"
        },
        {
            "id": 21, "worker_code": "WRK-2026-021", "name": "Pradeep Verma",
            "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98469 20020", "department": "Road Maintenance",
            "specialization": "Rapid Hot-Mix Patching Units",
            "primary_ward": "Ward 09 - Whitefield", "secondary_wards": "Ward 14 - Marathahalli",
            "availability": "Working", "current_workload": 5, "completed_jobs": 72,
            "avg_resolution_hours": 18.2, "rating": 4.9, "sla_compliance_pct": 98.4, "status": "Active"
        },
        {
            "id": 22, "worker_code": "WRK-2026-022", "name": "Balaji R.",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98470 21021", "department": "Electrical",
            "specialization": "Smart City IoT Streetlight Grid Nodes",
            "primary_ward": "Ward 11 - Electronic City", "secondary_wards": "Ward 05 - HSR Layout",
            "availability": "Available", "current_workload": 1, "completed_jobs": 38,
            "avg_resolution_hours": 17.0, "rating": 4.8, "sla_compliance_pct": 96.7, "status": "Active"
        },
        {
            "id": 23, "worker_code": "WRK-2026-023", "name": "Imran Khan",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98471 22022", "department": "Emergency Maintenance",
            "specialization": "Monsoon De-watering & Flood Barrier Deployment",
            "primary_ward": "Ward 04 - Koramangala", "secondary_wards": "Ward 07 - BTM Layout",
            "availability": "Available", "current_workload": 1, "completed_jobs": 30,
            "avg_resolution_hours": 9.2, "rating": 5.0, "sla_compliance_pct": 100.0, "status": "Active"
        },
        {
            "id": 24, "worker_code": "WRK-2026-024", "name": "Ganesh Murthy",
            "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98472 23023", "department": "Parks & Trees",
            "specialization": "Tree Roots Trimming & Carriageway Canopy Clearance",
            "primary_ward": "Ward 08 - Jayanagar", "secondary_wards": "Ward 17 - Banashankari",
            "availability": "Available", "current_workload": 2, "completed_jobs": 42,
            "avg_resolution_hours": 16.5, "rating": 4.7, "sla_compliance_pct": 95.0, "status": "Active"
        },
        {
            "id": 25, "worker_code": "WRK-2026-025", "name": "Naveen Krishna",
            "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
            "phone": "+91 98473 24024", "department": "Road Maintenance",
            "specialization": "Pothole Deep Injection & Bitumen Sealing",
            "primary_ward": "Ward 12 - Indiranagar", "secondary_wards": "Ward 10 - MG Road",
            "availability": "Available", "current_workload": 2, "completed_jobs": 49,
            "avg_resolution_hours": 20.0, "rating": 4.8, "sla_compliance_pct": 95.8, "status": "Active"
        }
    ]

    for item in workers_data:
        w = Worker(**item)
        db.merge(w)
    db.commit()
    print(f"[CivicEye AI] Seeded {len(workers_data)} municipal workers across all wards.")

def seed_demo_database(db: Session):
    """Populates full demo dataset with users, contacts, and 14 realistic civic issues."""
    # Ensure emergency contacts and notifications are always present
    seed_emergency_and_notifications(db)
    seed_workers(db)

    # Check if issues already seeded
    if db.query(Issue).first():
        return

    print("[CivicEye AI] Initializing rich demo database...")

    # 1. Users
    users = [
        User(
            id=1,
            email="citizen.priya@civiceye.in",
            full_name="Priya Sharma",
            hashed_password="demo_password_hash",
            role="citizen",
            ward="Ward 12 - Indiranagar",
            phone="+91 98765 43210"
        ),
        User(
            id=2,
            email="worker.rajesh@civiceye.in",
            full_name="Rajesh Kumar",
            hashed_password="demo_password_hash",
            role="worker",
            department="Roads & Public Infrastructure",
            ward="Ward 12 - Indiranagar",
            phone="+91 98765 11223"
        ),
        User(
            id=3,
            email="admin.verma@citycorp.gov.in",
            full_name="Dr. Arvind Verma",
            hashed_password="demo_password_hash",
            role="admin",
            department="Office of the Municipal Commissioner",
            phone="+91 98765 99887"
        )
    ]
    for u in users:
        db.merge(u)
    db.commit()

    # 2. Municipal Contacts for Wards
    contacts = [
        MunicipalContact(
            ward="Ward 12 - Indiranagar",
            department="Roads & Public Infrastructure",
            official_name="Er. Suresh Nambiar",
            designation="Executive Engineer (Roads)",
            email="ee.roads.w12@citycorp.gov.in",
            twitter_handle="@W12CivicWorks",
            phone="+91 80 2520 1144",
            escalation_level=1
        ),
        MunicipalContact(
            ward="Ward 04 - Koramangala",
            department="Stormwater Drains & Sanitation",
            official_name="Dr. Meenakshi Sundaram",
            designation="Superintending Engineer (SWD)",
            email="se.drains.w04@citycorp.gov.in",
            twitter_handle="@KoramangalaGov",
            phone="+91 80 2553 8820",
            escalation_level=1
        ),
        MunicipalContact(
            ward="Ward 08 - Jayanagar",
            department="Electrical & Streetlights",
            official_name="K. Ramanathan",
            designation="Assistant Executive Engineer (Elec)",
            email="aee.elec.w08@citycorp.gov.in",
            twitter_handle="@JayanagarWorks",
            phone="+91 80 2664 3310",
            escalation_level=1
        ),
        MunicipalContact(
            ward="Citywide Headquarters",
            department="Office of Municipal Commissioner",
            official_name="Dr. Arvind Verma, IAS",
            designation="Municipal Commissioner",
            email="commissioner@citycorp.gov.in",
            twitter_handle="@CityCorpChief",
            phone="+91 80 2221 0001",
            escalation_level=2
        )
    ]
    for c in contacts:
        db.add(c)
    db.commit()

    # 3. Create synthetic images for realistic visualization
    img_pothole_before = create_synthetic_civic_image("pothole_main_before.jpg", "before", "pothole")
    img_fake_after = create_synthetic_civic_image("fake_office_after.jpg", "after", "pothole", is_fake_fix=True)
    img_real_after = create_synthetic_civic_image("pothole_repaired_after.jpg", "after", "pothole", is_repaired=True)
    
    img_drain_before = create_synthetic_civic_image("open_drain_before.jpg", "before", "open drain")
    img_drain_after = create_synthetic_civic_image("drain_covered_after.jpg", "after", "open drain", is_repaired=True)

    img_garbage_before = create_synthetic_civic_image("garbage_pile_before.jpg", "before", "garbage")
    img_garbage_after = create_synthetic_civic_image("garbage_cleared_after.jpg", "after", "garbage", is_repaired=True)

    img_light_before = create_synthetic_civic_image("broken_light_before.jpg", "before", "broken streetlight")
    img_light_after = create_synthetic_civic_image("light_fixed_after.jpg", "after", "broken streetlight", is_repaired=True)

    img_water_before = create_synthetic_civic_image("water_leak_before.jpg", "before", "water leakage")
    img_road_before = create_synthetic_civic_image("road_damage_before.jpg", "before", "road damage")

    now = datetime.utcnow()

    # 4. SHOWCASE TICKET: CIV-2026-0007 (The critical demonstration issue)
    showcase_issue = Issue(
        id=7,
        ticket_id="CIV-2026-0007",
        category="Pothole",
        title="Hazardous Deep Arterial Pothole on 5th Cross Road",
        description="Severe crater spanning 1.4m across the main carriageway outside St. Joseph High School. Multiple two-wheelers have skidded. High collision hazard during peak hours.",
        latitude=12.9716,
        longitude=77.5946,
        address="5th Cross Rd, Near St. Joseph School, Ward 12, Indiranagar",
        ward="Ward 12 - Indiranagar",
        status="Disputed",  # Flagged by AI Fake-Fix Detector
        priority_score=94.5,
        priority_level="Critical",
        report_count=57,  # 57 citizen reports
        upvotes=184,
        reporter_name="Priya Sharma & 56 other residents",
        reporter_id=1,
        assigned_worker_id=2,
        before_image_url=img_pothole_before,
        after_image_url=img_fake_after,
        escalation_deadline=now - timedelta(hours=3),
        escalation_level=1,
        created_at=now - timedelta(hours=51),
        updated_at=now - timedelta(minutes=15)
    )
    db.add(showcase_issue)
    db.flush()

    # Add Showcase Reports (including duplicate merges)
    db.add(IssueReport(
        issue_id=showcase_issue.id,
        reporter_name="Priya Sharma",
        description="Major pothole near the school bus stop.",
        image_url=img_pothole_before,
        latitude=12.9716,
        longitude=77.5946,
        is_duplicate_merge=False,
        created_at=now - timedelta(hours=51)
    ))
    db.add(IssueReport(
        issue_id=showcase_issue.id,
        reporter_name="Arun Nair (PTA Secretary)",
        description="Duplicate report automatically merged via Smart Duplicate Detection (91% confidence).",
        image_url=img_pothole_before,
        latitude=12.9717,
        longitude=77.5947,
        is_duplicate_merge=True,
        similarity_score=91.4,
        created_at=now - timedelta(hours=42)
    ))
    db.add(IssueReport(
        issue_id=showcase_issue.id,
        reporter_name="Kavita Reddy",
        description="Duplicate report merged (88% match). Vehicle axle damaged yesterday.",
        image_url=img_pothole_before,
        latitude=12.9715,
        longitude=77.5945,
        is_duplicate_merge=True,
        similarity_score=88.2,
        created_at=now - timedelta(hours=28)
    ))

    # Showcase Repair Submission (Worker Rajesh submitted suspicious photo)
    fake_sub = RepairSubmission(
        id=1,
        issue_id=showcase_issue.id,
        worker_id=2,
        worker_name="Rajesh Kumar (Road Crew)",
        repair_notes="Asphalt patching completed with standard bitumen 60/70 mix and compacted with 2-ton roller.",
        materials_used="Cold mix bitumen, gravel ballast",
        after_image_url=img_fake_after,
        status="disputed",
        submitted_at=now - timedelta(hours=2)
    )
    db.add(fake_sub)
    db.flush()

    # Run actual CV verification on fake submission to create authentic AI record
    cv_result = verify_repair_cv(img_pothole_before, img_fake_after)
    ai_ver = AiVerification(
        issue_id=showcase_issue.id,
        repair_submission_id=fake_sub.id,
        location_match_score=cv_result["location_match_score"],
        scene_match_score=cv_result["scene_match_score"],
        repair_confidence_score=cv_result["repair_confidence_score"],
        suspicion_level=cv_result["suspicion_level"],
        verification_status=cv_result["verification_status"],
        diagnostic_summary=cv_result["diagnostic_summary"],
        failure_reasons=str(cv_result["failure_reasons"]),
        heatmap_url=cv_result["heatmap_url"],
        verified_at=now - timedelta(hours=2)
    )
    db.add(ai_ver)

    # Community Verification Votes for CIV-2026-0007
    db.add(CommunityVerification(
        issue_id=showcase_issue.id,
        citizen_name="Deepak V. (Local Resident)",
        vote="STILL_BROKEN",
        comments="I walk past here every evening. Nothing has been touched! The crater is still wide open.",
        created_at=now - timedelta(hours=1, minutes=30)
    ))
    db.add(CommunityVerification(
        issue_id=showcase_issue.id,
        citizen_name="Ananya Roy",
        vote="STILL_BROKEN",
        comments="Still broken! This worker uploaded a picture of an indoor office floor! Total fake fix.",
        created_at=now - timedelta(minutes=45)
    ))

    # Escalation Record for CIV-2026-0007
    db.add(Escalation(
        issue_id=showcase_issue.id,
        level=1,
        trigger_type="automatic_deadline",
        authority_name="Er. Suresh Nambiar",
        authority_email="ee.roads.w12@citycorp.gov.in",
        email_subject="CivicEye Escalation — Unresolved Pothole — CIV-2026-0007",
        email_body="Automated Level 1 Escalation: Unresolved after 48-hour statutory SLA. 57 citizen grievances recorded.",
        x_post_text="Public civic issue update: Ticket CIV-2026-0007 remains unresolved after 48 hours.\n\nIssue: Pothole\nArea: Ward 12\nReports: 57 citizens\nStatus: Escalated\n\nTracking: http://localhost:5173/issues/CIV-2026-0007 @CityCorpCivic",
        x_post_status="simulated",
        status="sent",
        sent_at=now - timedelta(hours=3)
    ))

    # Audit Logs for CIV-2026-0007
    timeline_events = [
        ("Citizen Reported Issue", "Citizen Priya Sharma filed initial report with geotagged photo.", now - timedelta(hours=51), "Priya Sharma", "citizen"),
        ("Smart Duplicate Detection", "Merged 56 neighborhood reports. Report count increased 1 -> 57. Priority upgraded to Critical.", now - timedelta(hours=48), "CivicEye AI Engine", "system"),
        ("Municipal Acknowledged", "Grievance acknowledged by Ward 12 Road Infrastructure division.", now - timedelta(hours=40), "Er. Suresh Nambiar", "admin"),
        ("48-Hour SLA Exceeded", "Statutory resolution deadline expired. Automated Level 1 Escalation dispatched.", now - timedelta(hours=3), "Escalation Engine", "system"),
        ("Repair Evidence Submitted", "Worker Rajesh Kumar submitted repair completion evidence.", now - timedelta(hours=2), "Rajesh Kumar", "worker"),
        ("AI Fake-Fix Flagged", "CV Engine flagged Suspicious Repair Evidence: Scene Match 18% (Indoor floor vs outdoor street). Status updated to Disputed.", now - timedelta(hours=2), "CivicEye AI Verifier", "system"),
        ("Community Verification Initiated", "Issue forwarded for neighborhood ground-truth voting.", now - timedelta(hours=1, minutes=45), "Audit System", "system"),
    ]
    for action, details, ts, actor, role in timeline_events:
        db.add(AuditLog(
            issue_id=showcase_issue.id,
            actor_name=actor,
            actor_role=role,
            action=action,
            details=details,
            timestamp=ts
        ))

    # 5. Add Remaining 13 Diverse Civic Issues across categories & statuses
    civic_scenarios = [
        # Resolved (3 issues)
        {
            "ticket_id": "CIV-2026-0001",
            "category": "Open Drain",
            "title": "Uncovered Stormwater Trench near Metro Station",
            "desc": "Concrete slab was displaced exposing deep sewage drain.",
            "lat": 12.9784, "lon": 77.6408, "ward": "Ward 04 - Koramangala",
            "address": "100 Feet Road, Near Metro Pillar 142",
            "status": "Resolved", "reports": 24, "upvotes": 68,
            "before": img_drain_before, "after": img_drain_after,
            "created_hours_ago": 96, "resolved": True
        },
        {
            "ticket_id": "CIV-2026-0002",
            "category": "Garbage",
            "title": "Overflowing Public Waste Dump at Market Junction",
            "desc": "Garbage accumulating for 5 days, blocking pedestrian walkway.",
            "lat": 12.9298, "lon": 77.5843, "ward": "Ward 08 - Jayanagar",
            "address": "4th Block Market Circle, Jayanagar",
            "status": "Resolved", "reports": 31, "upvotes": 85,
            "before": img_garbage_before, "after": img_garbage_after,
            "created_hours_ago": 72, "resolved": True
        },
        {
            "ticket_id": "CIV-2026-0003",
            "category": "Broken Streetlight",
            "title": "Dark Streetlamp Cluster on 7th Main",
            "desc": "Three consecutive streetlights faulty, causing unsafe dark stretch.",
            "lat": 12.9352, "lon": 77.6245, "ward": "Ward 04 - Koramangala",
            "address": "7th Main Road, 3rd Block",
            "status": "Resolved", "reports": 12, "upvotes": 41,
            "before": img_light_before, "after": img_light_after,
            "created_hours_ago": 60, "resolved": True
        },

        # In Progress (3 issues)
        {
            "ticket_id": "CIV-2026-0004",
            "category": "Water Leakage",
            "title": "High-Pressure Underground Main Pipe Rupture",
            "desc": "Potable water leaking onto public road, flooding adjacent basements.",
            "lat": 12.9698, "lon": 77.6012, "ward": "Ward 12 - Indiranagar",
            "address": "Double Road Junction, Richmond Circle",
            "status": "In Progress", "reports": 42, "upvotes": 115,
            "before": img_water_before, "after": None,
            "created_hours_ago": 26, "resolved": False
        },
        {
            "ticket_id": "CIV-2026-0005",
            "category": "Road Damage",
            "title": "Caved-In Asphalt Trench after Utility Cable Trenching",
            "desc": "Telecom contractor left unpaved gravel ditch across driving lane.",
            "lat": 12.9254, "lon": 77.5912, "ward": "Ward 08 - Jayanagar",
            "address": "9th Main, Jayanagar East",
            "status": "In Progress", "reports": 19, "upvotes": 53,
            "before": img_road_before, "after": None,
            "created_hours_ago": 20, "resolved": False
        },
        {
            "ticket_id": "CIV-2026-0006",
            "category": "Broken Streetlight",
            "title": "Flickering High-Mast Mast Light near Bus Terminus",
            "desc": "High mast light sparking during rain, dangerous electrical short.",
            "lat": 12.9772, "lon": 77.5714, "ward": "Ward 01 - Majestic",
            "address": "Majestic Central Bus Stand Exit Gate",
            "status": "In Progress", "reports": 28, "upvotes": 79,
            "before": img_light_before, "after": None,
            "created_hours_ago": 18, "resolved": False
        },

        # Escalated (2 issues)
        {
            "ticket_id": "CIV-2026-0008",
            "category": "Open Drain",
            "title": "Exposed Septic Sump Adjacent to Primary Health Center",
            "desc": "Uncovered drain poses extreme health biohazard and accident risk for patients.",
            "lat": 12.9515, "lon": 77.5684, "ward": "Ward 06 - Basavanagudi",
            "address": "Gandhi Bazaar Main Road",
            "status": "Escalated", "reports": 49, "upvotes": 138,
            "before": img_drain_before, "after": None,
            "created_hours_ago": 56, "resolved": False, "escalated": True
        },
        {
            "ticket_id": "CIV-2026-0009",
            "category": "Garbage",
            "title": "Illegal Commercial Debris Dump Blocking Fire Hydrant",
            "desc": "Construction rubble dumped illegally, completely sealing civic fire emergency access.",
            "lat": 12.9856, "lon": 77.6087, "ward": "Ward 10 - MG Road",
            "address": "Commercial Street Corner, Ward 10",
            "status": "Escalated", "reports": 37, "upvotes": 99,
            "before": img_garbage_before, "after": None,
            "created_hours_ago": 52, "resolved": False, "escalated": True
        },

        # Community Verification (2 issues)
        {
            "ticket_id": "CIV-2026-0010",
            "category": "Pothole",
            "title": "Multiple Potholes Patched on Inner Ring Road",
            "desc": "Road repair team completed hot-mix bitumen filling. Pending neighborhood verification.",
            "lat": 12.9431, "lon": 77.6321, "ward": "Ward 04 - Koramangala",
            "address": "Inner Ring Road, Domlur Flyover descent",
            "status": "Community Verification", "reports": 22, "upvotes": 61,
            "before": img_pothole_before, "after": img_real_after,
            "created_hours_ago": 36, "resolved": False, "verified_pass": True
        },
        {
            "ticket_id": "CIV-2026-0011",
            "category": "Broken Streetlight",
            "title": "LED Driver Replacement on Cross Road 3",
            "desc": "New 70W LED fixture installed. Citizens validating evening illumination.",
            "lat": 12.9388, "lon": 77.5812, "ward": "Ward 08 - Jayanagar",
            "address": "32nd Cross, 7th Block",
            "status": "Community Verification", "reports": 15, "upvotes": 44,
            "before": img_light_before, "after": img_light_after,
            "created_hours_ago": 30, "resolved": False, "verified_pass": True
        },

        # Newly Reported & Acknowledged (3 issues)
        {
            "ticket_id": "CIV-2026-0012",
            "category": "Water Leakage",
            "title": "Fresh Pipeline Burst Flooding Residential Lane",
            "desc": "Main water pipeline cracked this morning. Water pressure lost across 40 homes.",
            "lat": 12.9733, "lon": 77.6189, "ward": "Ward 12 - Indiranagar",
            "address": "12th Main, HAL 2nd Stage",
            "status": "Reported", "reports": 8, "upvotes": 25,
            "before": img_water_before, "after": None,
            "created_hours_ago": 4, "resolved": False
        },
        {
            "ticket_id": "CIV-2026-0013",
            "category": "Road Damage",
            "title": "Sunken Manhole Cover Causing Vehicle Bottoming Out",
            "desc": "Manhole sits 15cm below road grade without warning paint.",
            "lat": 12.9554, "lon": 77.5898, "ward": "Ward 06 - Basavanagudi",
            "address": "Lalbagh West Gate Road",
            "status": "Acknowledged", "reports": 14, "upvotes": 38,
            "before": img_road_before, "after": None,
            "created_hours_ago": 12, "resolved": False
        },
        {
            "ticket_id": "CIV-2026-0014",
            "category": "Garbage",
            "title": "Bio-waste Spillage near Community Park",
            "desc": "Trash bin broken and animal scavenging scattering debris over playground.",
            "lat": 12.9645, "lon": 77.5921, "ward": "Ward 12 - Indiranagar",
            "address": "Defence Colony Park Gate",
            "status": "Reported", "reports": 16, "upvotes": 49,
            "before": img_garbage_before, "after": None,
            "created_hours_ago": 7, "resolved": False
        }
    ]

    for item in civic_scenarios:
        created_dt = now - timedelta(hours=item["created_hours_ago"])
        deadline = created_dt + timedelta(hours=48)
        is_esc = item.get("escalated", False)
        
        score, p_level = calculate_priority_score(
            category=item["category"],
            report_count=item["reports"],
            upvotes=item["upvotes"],
            created_at=created_dt,
            is_escalated=is_esc
        )

        # Assign specific tickets to workers:
        # Worker 2 (Rajesh Kumar) gets CIV-2026-0007 (showcase) and CIV-2026-0012
        assigned_wid = None
        if item["ticket_id"] == "CIV-2026-0012":
            assigned_wid = 2
            item["status"] = "In Progress"
        elif item["ticket_id"] == "CIV-2026-0001":
            assigned_wid = 3  # Amit Roy (Electrical)
        elif item["ticket_id"] == "CIV-2026-0003":
            assigned_wid = 1  # Rahul Das (Roads)
        elif item["ticket_id"] == "CIV-2026-0005":
            assigned_wid = 4  # Suresh Babu (Water)

        issue = Issue(
            ticket_id=item["ticket_id"],
            category=item["category"],
            title=item["title"],
            description=item["desc"],
            latitude=item["lat"],
            longitude=item["lon"],
            address=item["address"],
            ward=item["ward"],
            status=item["status"],
            priority_score=score,
            priority_level=p_level,
            report_count=item["reports"],
            upvotes=item["upvotes"],
            reporter_name="Citizen Reporter",
            assigned_worker_id=assigned_wid,
            before_image_url=item["before"],
            after_image_url=item["after"],
            escalation_deadline=deadline,
            escalation_level=1 if is_esc else 0,
            created_at=created_dt,
            updated_at=now - timedelta(hours=random.randint(1, 5))
        )
        db.add(issue)
        db.flush()

        # Add initial report
        db.add(IssueReport(
            issue_id=issue.id,
            reporter_name="Citizen Reporter",
            description=item["desc"],
            image_url=item["before"],
            latitude=item["lat"],
            longitude=item["lon"],
            is_duplicate_merge=False,
            created_at=created_dt
        ))

        # Add initial audit log
        db.add(AuditLog(
            issue_id=issue.id,
            actor_name="Citizen Reporter",
            actor_role="citizen",
            action="Issue Reported",
            details=f"Complaint registered under category {item['category']}.",
            timestamp=created_dt
        ))

        # If Community Verification, add votes and real AI verification
        if item.get("verified_pass"):
            rep_sub = RepairSubmission(
                issue_id=issue.id,
                worker_name="Rajesh Kumar",
                repair_notes="Standard maintenance completed per specification.",
                after_image_url=item["after"],
                status="approved",
                submitted_at=now - timedelta(hours=6)
            )
            db.add(rep_sub)
            db.flush()

            db.add(AiVerification(
                issue_id=issue.id,
                repair_submission_id=rep_sub.id,
                location_match_score=92.4,
                scene_match_score=89.1,
                repair_confidence_score=94.0,
                suspicion_level="LOW",
                verification_status="PASSED",
                diagnostic_summary="High background keypoint correlation (89%) and genuine structural repair detected. Qualified for Community Verification.",
                verified_at=now - timedelta(hours=6)
            ))

            db.add(CommunityVerification(
                issue_id=issue.id,
                citizen_name="Resident S. Nair",
                vote="FIXED",
                comments="Looks solidly fixed. Traffic is flowing smoothly again.",
                created_at=now - timedelta(hours=3)
            ))
            db.add(CommunityVerification(
                issue_id=issue.id,
                citizen_name="M. Farooq",
                vote="FIXED",
                comments="Verified in person this morning. Great job.",
                created_at=now - timedelta(hours=2)
            ))

        # If Escalated, add escalation entry
        if is_esc:
            db.add(Escalation(
                issue_id=issue.id,
                level=1,
                trigger_type="automatic_deadline",
                authority_name="Executive Engineer",
                authority_email="ee.civic@citycorp.gov.in",
                email_subject=f"CivicEye Escalation — Unresolved {issue.category} — {issue.ticket_id}",
                email_body=f"SLA 48h exceeded for ticket {issue.ticket_id}. Urgent public works attention required.",
                x_post_text=f"Public civic issue update: Ticket {issue.ticket_id} remains unresolved after 48 hours.\nIssue: {issue.category}\nReports: {issue.report_count} citizens\nStatus: Escalated @CityCorpCivic",
                x_post_status="simulated",
                status="sent",
                sent_at=now - timedelta(hours=4)
            ))

    # Seed initial GeneratedReport records for resolved issues
    resolved_issue_2 = db.query(Issue).filter(Issue.ticket_id == "CIV-2026-0002").first()
    if resolved_issue_2 and not db.query(GeneratedReport).filter(GeneratedReport.ticket_id == "CIV-2026-0002").first():
        rep_2 = GeneratedReport(
            report_id="REP-2026-0002",
            ticket_id="CIV-2026-0002",
            issue_id=resolved_issue_2.id,
            category=resolved_issue_2.category,
            title=resolved_issue_2.title,
            ward=resolved_issue_2.ward,
            location_address=resolved_issue_2.address,
            latitude=resolved_issue_2.latitude,
            longitude=resolved_issue_2.longitude,
            worker_name="Rajesh Kumar",
            worker_department="Roads & Public Infrastructure",
            date_reported=resolved_issue_2.created_at,
            date_assigned=resolved_issue_2.created_at + timedelta(hours=2),
            date_started=resolved_issue_2.created_at + timedelta(hours=4),
            date_completed=resolved_issue_2.updated_at,
            resolution_time_hours=18.5,
            priority_level=resolved_issue_2.priority_level,
            citizen_report_count=resolved_issue_2.report_count,
            before_image_url=resolved_issue_2.before_image_url,
            after_image_url=resolved_issue_2.after_image_url or resolved_issue_2.before_image_url,
            ai_verification_status="Approved",
            ai_inlier_ratio=91.4,
            community_consensus_pct=88.0,
            worker_notes="Cast-iron grating was procured and fitted securely over the open storm drain with reinforced concrete anchoring.",
            admin_verification="Verified & Formally Approved by Municipal Commissioner Dr. Arvind Verma, IAS",
            final_status="Resolved",
            summary_text="Ticket CIV-2026-0002 concerned an open drain hazard reported in Ward 12. The issue was assigned to municipal worker Rajesh Kumar and repair activity was completed with reinforced grating. Before-and-after evidence was reviewed using CivicEye AI verification (91.4% scene match) and approved by neighborhood consensus. The complaint has been marked as resolved.",
            created_at=now - timedelta(hours=12),
            created_by="Dr. Arvind Verma, IAS (Municipal Commissioner)"
        )
        db.add(rep_2)

    db.commit()
    print("[CivicEye AI] Demo database successfully seeded with 14 civic issues and showcase ticket CIV-2026-0007!")
