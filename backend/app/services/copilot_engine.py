"""
CivicEye AI — Role-Scoped Multi-Lingual AI Copilot Engine
Provides tailored, permission-scoped intelligence for:
- Citizen (Drafting, Category Classification, Emergency Detection, Civic Credits)
- Worker (Assigned Work Order guidance, Priority queues, Repair note generation)
- Admin (Citywide stats, Ward backlogs, Worker workloads, Escalation tracking)
Supports English, Bengali (বাংলা), and Hindi (हिन्दी).
"""

import re
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.issue import Issue
from app.models.worker import Worker
from app.models.credits import CreditTransaction

def detect_language(text: str, default_lang: str = "en") -> str:
    """Detects if user input contains Bengali or Hindi scripts or honors default_lang."""
    # Bengali Unicode range: 0980–09FF
    if re.search(r'[\u0980-\u09FF]', text):
        return "bn"
    # Devanagari (Hindi) Unicode range: 0900–097F
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"
    if default_lang in ["bn", "hi"]:
        return default_lang
    return "en"

def process_copilot_chat(
    db: Session,
    message: str,
    role: str,
    user_id: Optional[int] = None,
    worker_id: Optional[int] = None,
    language: str = "en"
) -> Dict[str, Any]:
    """
    Processes chat message strictly scoped by role and user permissions.
    """
    clean_msg = message.strip()
    msg_lower = clean_msg.lower()
    lang = detect_language(clean_msg, language)

    # -------------------------------------------------------------
    # 1. WORKER COPILOT — Strictly limited to assigned tickets
    # -------------------------------------------------------------
    if role == "worker":
        # Check if worker attempted to request citywide unauthorized data
        citywide_triggers = ["every complaint", "all issues", "citywide", "other workers", "all complaints", "whole city"]
        if any(trig in msg_lower for trig in citywide_triggers):
            if lang == "bn":
                return {
                    "response": "আমি শুধুমাত্র আপনার অ্যাকাউন্টে অর্পিত কাজের সাথে সাহায্য করতে পারি। অনুমতি বহির্ভূত কোনো তথ্য প্রকাশ করা যাবে না।",
                    "role": "worker",
                    "language": "bn"
                }
            elif lang == "hi":
                return {
                    "response": "मैं केवल आपके खाते को सौंपे गए कार्यों में सहायता कर सकता हूँ। अनधिकृत शिकायतें प्रदर्शित नहीं की जा सकतीं।",
                    "role": "worker",
                    "language": "hi"
                }
            else:
                return {
                    "response": "I can only help with issues currently assigned to your account. I cannot expose unauthorized municipal complaints.",
                    "role": "worker",
                    "language": "en"
                }

        # Query only worker's assigned issues
        target_worker_id = worker_id or 2  # Default Rajesh Kumar
        assigned_issues = db.query(Issue).filter(
            Issue.assigned_worker_id == target_worker_id,
            Issue.status != "Resolved"
        ).order_by(Issue.priority_score.desc()).all()

        total_assigned = len(assigned_issues)
        critical_count = sum(1 for i in assigned_issues if i.priority_level == "Critical")
        highest_prio = assigned_issues[0] if assigned_issues else None

        # Intention 1: What should I do next / What is assigned
        if any(w in msg_lower for w in ["what should i do", "what work is assigned", "next", "handle first", "today", "tasks"]):
            if total_assigned == 0:
                resp = {
                    "en": "You have no pending tasks assigned at this moment. You are marked as Available for new work orders.",
                    "bn": "আপনার কাছে বর্তমানে কোনো অমীমাংসিত কাজ নেই। নতুন কাজের জন্য আপনি প্রস্তুত আছেন।",
                    "hi": "वर्तमान में आपके पास कोई लंबित कार्य नहीं है। आप नए कार्य आदेशों के लिए उपलब्ध हैं।"
                }
                return {"response": resp.get(lang, resp["en"]), "role": "worker", "language": lang}

            if lang == "bn":
                text = (
                    f"আপনার বর্তমানে {total_assigned} টি কাজ অর্পিত আছে।\n\n"
                    f"**সর্বোচ্চ অগ্রাধিকারপ্রাপ্ত কাজ:**\n"
                    f"• টিকিট: **{highest_prio.ticket_id}**\n"
                    f"• বিভাগ: {highest_prio.category}\n"
                    f"• অবস্থান: {highest_prio.ward}\n"
                    f"• গুরুত্ব: **{highest_prio.priority_level}** ({highest_prio.priority_score}/100)\n\n"
                    f"**প্রস্তাবিত পদক্ষেপ:**\n"
                    f"ঘটনাস্থল পরিদর্শন করুন এবং মেরামত সম্পন্ন করে প্রামাণ্য ছবি আপলোড করুন।"
                )
            elif lang == "hi":
                text = (
                    f"वर्तमान में आपके पास {total_assigned} सौंपे गए कार्य हैं।\n\n"
                    f"**सर्वोच्च प्राथमिकता कार्य:**\n"
                    f"• टिकट: **{highest_prio.ticket_id}**\n"
                    f"• श्रेणी: {highest_prio.category}\n"
                    f"• वार्ड: {highest_prio.ward}\n"
                    f"• प्राथमिकता: **{highest_prio.priority_level}** ({highest_prio.priority_score}/100)\n\n"
                    f"**अनुशंसित अगली कार्रवाई:**\n"
                    f"कार्यस्थल का निरीक्षण करें और मरम्मत के बाद साक्ष्य फ़ोटो अपलोड करें।"
                )
            else:
                text = (
                    f"You currently have {total_assigned} assigned issues ({critical_count} Critical).\n\n"
                    f"**Highest Priority Task:**\n"
                    f"• Ticket: **{highest_prio.ticket_id}** — {highest_prio.title}\n"
                    f"• Location: {highest_prio.address} ({highest_prio.ward})\n"
                    f"• Priority: **{highest_prio.priority_level}** ({highest_prio.priority_score}/100)\n\n"
                    f"**Recommended next action:**\n"
                    f"Inspect the physical site, initiate repair work, and upload After-evidence photograph for OpenCV verification."
                )
            return {"response": text, "role": "worker", "language": lang, "suggested_ticket": highest_prio.ticket_id}

        # Intention 2: Summarize specific ticket (e.g. CIV-2026-0007)
        ticket_match = re.search(r'civ-\d{4}-\d{4}', msg_lower)
        if ticket_match:
            target_ticket = ticket_match.group(0).upper()
            target_issue = db.query(Issue).filter(
                Issue.ticket_id == target_ticket,
                Issue.assigned_worker_id == target_worker_id
            ).first()

            if not target_issue:
                return {
                    "response": f"Ticket {target_ticket} is not assigned to your worker profile.",
                    "role": "worker",
                    "language": lang
                }

            text = (
                f"**Summary of {target_issue.ticket_id}:**\n"
                f"• Title: {target_issue.title}\n"
                f"• Category: {target_issue.category}\n"
                f"• Location: {target_issue.address}\n"
                f"• Citizen Reports: {target_issue.report_count} voiced\n"
                f"• Current Status: {target_issue.status}\n"
                f"• Deadline: {target_issue.escalation_deadline.strftime('%d %b %Y, %H:%M')}\n\n"
                f"Ensure work is physically documented with matching camera angles to pass RANSAC keypoint verification."
            )
            return {"response": text, "role": "worker", "language": lang}

        # Intention 3: Evidence guidance
        if any(w in msg_lower for w in ["evidence", "photo", "upload", "proof", "fake"]):
            text = (
                "**CivicEye AI Evidence Guidelines for Workers:**\n"
                "1. Capture the completed repair from the exact same angle and distance as the Before photo.\n"
                "2. Include adjacent landmarks (curbs, buildings, manhole covers) to maximize ORB feature keypoints.\n"
                "3. Ensure bright natural lighting and avoid blurry motion shots.\n"
                "4. Mismatched or fake photos (e.g. indoor tiles, stock imagery) are automatically flagged as Disputed."
            )
            return {"response": text, "role": "worker", "language": lang}

        # Default worker response
        return {
            "response": (
                f"Worker Field Assistant active. You have {total_assigned} assigned tasks. "
                "You can ask me: 'What work is assigned to me today?', 'Which issue should I handle first?', "
                "or provide bullet points to generate your municipal repair note."
            ),
            "role": "worker",
            "language": lang
        }

    # -------------------------------------------------------------
    # 2. CITIZEN COPILOT — Safe reporting & drafting assistance
    # -------------------------------------------------------------
    if role == "citizen":
        # Emergency detection
        danger_keywords = ["fire", "spark", "electric", "flood", "collapse", "gas leak", "accident", "injury", "danger", "hazard", "exposed wire"]
        if any(k in msg_lower for k in danger_keywords):
            if lang == "bn":
                return {
                    "response": "⚠️ **জরুরী সতর্কতা শনাক্ত করা হয়েছে!**\nজীবন বা নিরাপত্তার তাৎক্ষণিক ঝুঁকি থাকলে অবিলম্বে জরুরি সহায়তা নম্বরে (112 / ফায়ার সার্ভিস) যোগাযোগ করুন। আমি আপনার অভিযোগ তৈরিতেও সাহায্য করছি।",
                    "role": "citizen",
                    "is_emergency": True,
                    "language": "bn"
                }
            elif lang == "hi":
                return {
                    "response": "⚠️ **आपातकालीन चेतावनी पाई गई!**\nयदि जीवन या सुरक्षा के लिए तत्काल खतरा है, तो कृपया तुरंत 112 या आपातकालीन हेल्पलाइन पर संपर्क करें। मैं आपकी शिकायत दर्ज करने में भी मदद कर रहा हूँ।",
                    "role": "citizen",
                    "is_emergency": True,
                    "language": "hi"
                }
            else:
                return {
                    "response": "⚠️ **Critical Safety Hazard Detected!**\nIf there is immediate danger to human life or structural collapse, please trigger the Emergency 112 hotline immediately. I am also preparing a high-priority hazard report for municipal dispatch.",
                    "role": "citizen",
                    "is_emergency": True,
                    "language": "en"
                }

        # Category and Description drafting
        if any(w in msg_lower for w in ["hole", "pothole", "crater", "tarmac", "asphalt", "bump"]):
            return {
                "response": (
                    "This appears to be a **Road / Pothole** issue.\n\n"
                    "**Suggested Category:** Pothole\n"
                    "**Suggested Description:** A severe road crater has formed on the carriageway, creating safety hazards and skidding risks for two-wheelers and vehicles.\n\n"
                    "Would you like me to populate this into your report draft? Please drop a pin on the map to confirm the exact location."
                ),
                "suggested_category": "Pothole",
                "suggested_title": "Severe Road Pothole Creating Vehicle Hazard",
                "suggested_description": "Deep asphalt crater on main carriageway posing collision and skid danger for commuters.",
                "role": "citizen",
                "language": lang
            }

        if any(w in msg_lower for w in ["light", "dark", "lamp", "pole", "street light"]):
            return {
                "response": (
                    "This appears to be a **Broken Streetlight** issue.\n\n"
                    "**Suggested Category:** Broken Streetlight\n"
                    "**Suggested Description:** Street illumination luminaire is non-operational, causing severe pedestrian safety and security concerns after dusk.\n\n"
                    "Drop a pin on your road to automatically detect your municipal ward."
                ),
                "suggested_category": "Broken Streetlight",
                "suggested_title": "Non-Functional Streetlight Luminaire on Sector Road",
                "suggested_description": "Dark stretch due to burnt-out street fixture creating public safety concerns at night.",
                "role": "citizen",
                "language": lang
            }

        if any(w in msg_lower for w in ["water", "leak", "pipe", "burst", "drain", "sewage", "flood"]):
            return {
                "response": (
                    "This appears to be a **Water Leakage & Drainage** issue.\n\n"
                    "**Suggested Category:** Water Leakage\n"
                    "**Suggested Description:** High pressure potable water pipeline leakage flooding public roadway and eroding foundation.\n\n"
                    "You will earn **+10 Pending Civic Credits** upon reporting!"
                ),
                "suggested_category": "Water Leakage",
                "suggested_title": "Water Pipeline Rupture Flooding Public Roadway",
                "suggested_description": "Potable supply pipe breach causing road waterlogging and pressure loss.",
                "role": "citizen",
                "language": lang
            }

        if any(w in msg_lower for w in ["credit", "point", "badge", "reward"]):
            return {
                "response": (
                    "**How Civic Credits Work:**\n"
                    "• **+10 Credits Pending:** When submitting a new valid grievance.\n"
                    "• **+5 Credits Confirmed:** When supporting / merging with an existing issue.\n"
                    "• **+3 Credits:** When casting a community ground-truth verification vote.\n"
                    "• **+10 Bonus Credits:** When your reported issue is successfully repaired and verified by AI.\n\n"
                    "Credits establish your neighborhood reputation and unlock Civic Champion badges!"
                ),
                "role": "citizen",
                "language": lang
            }

        # Default Citizen greeting
        if lang == "bn":
            return {
                "response": "নমস্কার! আমি সিভিকআই এআই কোপাইলট। আপনি যে নাগরিক সমস্যার মুখোমুখি হচ্ছেন (রাস্তার গর্ত, ড্রেন, আবর্জনা, বা বাতি) তা আমাকে বলুন। আমি সঠিকভাবে রিপোর্ট তৈরি করতে সাহায্য করব।",
                "role": "citizen",
                "language": "bn"
            }
        elif lang == "hi":
            return {
                "response": "नमस्ते! मैं सिविकआई एआई कोपायलट हूँ। मुझे अपनी नागरिक समस्या (सड़क का गड्ढा, स्ट्रीटलाइट, कचरा, या जल रिसाव) के बारे में बताएं। मैं सही रिपोर्ट तैयार करने में आपकी मदद करूँगा।",
                "role": "citizen",
                "language": "hi"
            }
        else:
            return {
                "response": (
                    "Hello! I am your **CivicEye Citizen Copilot**.\n\n"
                    "Describe any civic defect you see (e.g. *'There is a big hole in the road near my college'*), "
                    "and I will classify the category, draft an official description, check for emergency risks, "
                    "and help you submit your report to earn Civic Credits."
                ),
                "role": "citizen",
                "language": "en"
            }

    # -------------------------------------------------------------
    # 3. ADMIN COPILOT — Administrative intelligence across DB
    # -------------------------------------------------------------
    if role == "admin":
        total_open = db.query(Issue).filter(Issue.status != "Resolved").count()
        critical_count = db.query(Issue).filter(Issue.priority_level == "Critical", Issue.status != "Resolved").count()
        unassigned_count = db.query(Issue).filter(Issue.assigned_worker_id == None, Issue.status != "Resolved").count()
        active_workers = db.query(Worker).filter(Worker.availability == "Available").count()

        # Query ward with most open issues
        ward_counts = db.query(Issue.ward, func.count(Issue.id)).filter(Issue.status != "Resolved").group_by(Issue.ward).all()
        top_ward = max(ward_counts, key=lambda x: x[1]) if ward_counts else ("Ward 12 - Indiranagar", 0)

        if any(w in msg_lower for w in ["critical", "severity", "urgent"]):
            return {
                "response": f"There are currently **{critical_count} Critical civic issues** requiring immediate intervention. Highest priority ticket is CIV-2026-0007 in {top_ward[0]}.",
                "role": "admin",
                "language": lang
            }

        if any(w in msg_lower for w in ["ward", "unresolved", "hotspot"]):
            return {
                "response": f"**{top_ward[0]}** currently has the highest backlog with **{top_ward[1]} open grievances**. Recommended to deploy secondary maintenance crew from adjacent zones.",
                "role": "admin",
                "language": lang
            }

        if any(w in msg_lower for w in ["worker", "workload", "available"]):
            return {
                "response": f"There are **{active_workers} municipal workers currently Available** on shift across all 8 departments. Total unassigned tickets: {unassigned_count}.",
                "role": "admin",
                "language": lang
            }

        return {
            "response": (
                f"**CivicEye Admin Command Intelligence:**\n"
                f"• Total Open Issues: **{total_open}**\n"
                f"• Critical Incidents: **{critical_count}**\n"
                f"• Unassigned Tickets: **{unassigned_count}**\n"
                f"• Highest Backlog: **{top_ward[0]}** ({top_ward[1]} issues)\n"
                f"• Available Workers: **{active_workers}** on duty\n\n"
                "Ask me any operational question regarding ward performance, worker workload, or completed repairs."
            ),
            "role": "admin",
            "language": lang
        }

    return {"response": "Welcome to CivicEye AI Assistant.", "role": role, "language": "en"}
