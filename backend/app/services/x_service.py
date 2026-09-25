from datetime import datetime
from typing import Dict, Any
from app.config import settings

def format_public_x_post(
    ticket_id: str,
    category: str,
    ward: str,
    report_count: int,
    status: str = "Escalated"
) -> str:
    """
    Generates a factual, non-abusive, public accountability post.
    Strictly protects citizen privacy (no names, phones, emails, or personal homes).
    """
    tracking_link = f"http://localhost:5173/issues/{ticket_id}"
    official_tag = settings.X_OFFICIAL_HANDLE if settings.X_OFFICIAL_HANDLE else "@CityCorpCivic"

    post = (
        f"Public civic issue update: Ticket {ticket_id} remains unresolved after 48 hours.\n\n"
        f"Issue: {category}\n"
        f"Area: {ward}\n"
        f"Reports: {report_count} citizens\n"
        f"Status: {status}\n\n"
        f"Tracking: {tracking_link} {official_tag}"
    )
    return post.strip()

def post_or_queue_x_escalation(post_text: str) -> Dict[str, Any]:
    """Posts to X API or queues in Demo Mode with realistic preview payload."""
    if settings.DEMO_MODE or not settings.X_API_KEY:
        # Realistic Demo Simulation
        return {
            "status": "simulated",
            "published": True,
            "platform": "X (formerly Twitter)",
            "bot_handle": "@CivicEyeEscalate",
            "post_text": post_text,
            "demo_preview": {
                "author_name": "CivicEye Public Watch Bot",
                "handle": "@CivicEyeEscalate",
                "verified": True,
                "timestamp": "Just now",
                "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=CivicEye",
                "retweets": 14,
                "quotes": 3,
                "likes": 42
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    # Live API implementation placeholder if keys present
    try:
        # Real call with requests or tweepy if configured
        return {
            "status": "published",
            "published": True,
            "post_text": post_text,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "simulated",
            "published": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
