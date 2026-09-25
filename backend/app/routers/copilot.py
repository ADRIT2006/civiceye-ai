"""
CivicEye AI — Copilot Router
Provides unified role-scoped intelligent endpoints for Citizen, Worker, and Admin.
"""

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.services.copilot_engine import process_copilot_chat
from app.services.rbac import get_current_role

router = APIRouter(prefix="/api/copilot", tags=["AI Copilot"])

class ChatRequest(BaseModel):
    message: str
    role: Optional[str] = None
    language: Optional[str] = "en"
    user_id: Optional[int] = 1
    worker_id: Optional[int] = 2

class DraftRequest(BaseModel):
    text: str
    language: Optional[str] = "en"

class RepairNoteRequest(BaseModel):
    raw_notes: str
    ticket_id: Optional[str] = None
    language: Optional[str] = "en"

@router.post("/chat")
def copilot_chat_endpoint(
    req: ChatRequest,
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
    x_worker_id: Optional[str] = Header(None)
):
    """Role-scoped conversational copilot supporting English, Bengali, and Hindi."""
    effective_role = req.role or get_current_role(x_user_role)
    worker_id = int(x_worker_id) if (x_worker_id and x_worker_id.isdigit()) else req.worker_id

    result = process_copilot_chat(
        db=db,
        message=req.message,
        role=effective_role,
        user_id=req.user_id,
        worker_id=worker_id,
        language=req.language or "en"
    )
    return result

@router.post("/classify-draft")
def classify_citizen_draft(req: DraftRequest):
    """Citizen draft classifier suggesting category, title, description, and emergency flags."""
    text_lower = req.text.lower()

    if any(k in text_lower for k in ["fire", "spark", "electric", "flood", "collapse", "gas", "wire"]):
        return {
            "suggested_category": "Broken Streetlight" if "light" in text_lower or "wire" in text_lower else "Water Leakage",
            "suggested_title": "Urgent Civic Infrastructure Safety Hazard",
            "suggested_description": req.text,
            "severity_suggestion": "Critical",
            "is_emergency": True,
            "emergency_advisory": "Statutory safety hazard identified. Emergency hotline advisory triggered."
        }

    if any(k in text_lower for k in ["hole", "pothole", "crater", "tarmac", "road", "skid"]):
        return {
            "suggested_category": "Pothole",
            "suggested_title": "Dangerous Carriageway Pothole Causing Vehicle Hazard",
            "suggested_description": f"Deep asphalt crater present on the roadway: {req.text}. Requires bitumen filling.",
            "severity_suggestion": "High",
            "is_emergency": False,
            "emergency_advisory": None
        }

    if any(k in text_lower for k in ["light", "dark", "lamp", "pole", "fixture"]):
        return {
            "suggested_category": "Broken Streetlight",
            "suggested_title": "Non-Functional Streetlight Luminaire on Sector Road",
            "suggested_description": f"Burnt-out streetlight fixture causing darkness: {req.text}. Poses nighttime pedestrian safety risk.",
            "severity_suggestion": "Medium",
            "is_emergency": False,
            "emergency_advisory": None
        }

    if any(k in text_lower for k in ["water", "pipe", "leak", "drain", "sewage", "overflow"]):
        return {
            "suggested_category": "Water Leakage",
            "suggested_title": "High-Pressure Underground Pipe Leakage Flooding Public Lane",
            "suggested_description": f"Municipal water supply line cracked: {req.text}. Causing street flooding and foundation damage.",
            "severity_suggestion": "High",
            "is_emergency": False,
            "emergency_advisory": None
        }

    if any(k in text_lower for k in ["garbage", "trash", "waste", "dump", "stench"]):
        return {
            "suggested_category": "Garbage",
            "suggested_title": "Accumulated Solid Waste Spillage Obstructing Public Footpath",
            "suggested_description": f"Municipal bin overflow and uncollected debris: {req.text}. Poses hygiene concerns.",
            "severity_suggestion": "Medium",
            "is_emergency": False,
            "emergency_advisory": None
        }

    return {
        "suggested_category": "Road Damage",
        "suggested_title": "Public Infrastructure Defect Reported by Citizen",
        "suggested_description": req.text,
        "severity_suggestion": "Medium",
        "is_emergency": False,
        "emergency_advisory": None
    }

@router.post("/repair-note")
def generate_worker_repair_note(req: RepairNoteRequest):
    """Transforms raw worker bullet points into an official municipal repair log note."""
    raw = req.raw_notes.strip()
    ticket = req.ticket_id or "CIV-2026-0007"

    formal_note = (
        f"On-site physical remediation executed for grievance {ticket}. "
        f"Work performed: {raw.rstrip('.')}. "
        "The affected sector was cleared of debris, structurally leveled, and inspected post-completion. "
        "Photographic After-evidence submitted for automated OpenCV visual verification."
    )

    return {
        "success": True,
        "raw_input": raw,
        "generated_note": formal_note,
        "requires_worker_approval": True
    }
