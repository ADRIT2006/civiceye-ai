# CivicEye AI — Civic Issue Escalation & Public Accountability Platform
> *"Turning Civic Complaints Into Public Accountability — See it. Report it. Track it. Fix it."*

---

## 🏛️ Executive Summary

**CivicEye AI** is a next-generation civic technology platform engineered for high-impact civic grievance tracking, automated bureaucratic escalation, and AI-powered ground-truth verification.

Traditional municipal complaint portals act as black holes: citizens submit grievances, duplicates clutter the queue, complaints sit dormant for months, and maintenance crews often close tickets with false or unverified claims.

CivicEye AI solves this through three core technical innovations:
1. **Smart Spatial & Visual Duplicate Detection**: Merges multiple nearby complaints (within 50 meters) into one high-pressure master ticket using GPS clustering, category matching, and OpenCV perceptual hashing / ORB feature matching.
2. **AI Repair Verifier ("Fake Fix" Detector)**: Validates municipal repair submissions by comparing Before vs After photographs using OpenCV RANSAC homography, keypoint inlier density, and edge structural analysis to detect and flag fraudulent or mismatched photo evidence.
3. **Automated 48-Hour Escalation & Public Social Bot**: Enforces statutory resolution SLAs with real-time countdown clocks. Unresolved issues automatically trigger Level 1 grievance emails to Ward Executive Engineers and Level 2 public accountability broadcasts via a factual social bot (X/Twitter).

---

## 🚀 Key Features

- **Citizen Reporting Hub**:
  - Drag-and-drop Leaflet GPS pin drop or one-click browser geolocation.
  - Multi-category classification (Potholes, Broken Streetlights, Open Drains, Garbage, Water Leakage, Road Damage).
  - Pre-submission instant duplicate detection warning.
  - Citizen upvoting and neighborhood voice aggregation.
- **Smart Duplicate Merging**:
  - Evaluates distance (<=50m: +40 pts), category match (+20 pts), OpenCV visual similarity (+30 pts), and recency (+10 pts).
  - Allows citizens to merge duplicate grievances with 1 click, compounding the ticket priority (e.g., 56 → 57 reports) instead of fragmenting the database.
- **OpenCV AI "Fake Fix" Detector**:
  - Feature matching using ORB keypoints and Lowe's ratio test.
  - Homography with RANSAC mask to compute inlier ratio (Scene Match %).
  - Suspicion scoring (`LOW`, `MEDIUM`, `HIGH`).
  - Flags mismatched photographs (e.g., worker submitting an indoor floor for a street pothole) as `Disputed` / `Manual Review Required`.
  - Generates thermal difference heatmaps.
- **Community Ground-Truth Verification**:
  - Field crew cannot self-resolve tickets. Submissions require neighborhood consensus voting (YES: Fixed / NO: Still Broken).
  - Configurable 75% consensus threshold before permanent closure.
- **48-Hour Statutory Escalation Engine**:
  - Real-time countdown timer on every grievance.
  - Level 1: Official automated grievance email formatted for municipal authorities.
  - Level 2: Factual, non-abusive public accountability broadcast on X/Twitter.
- **Interactive Full-Page Civic Map**:
  - Leaflet + CARTO Dark basemap with custom pulsing status pins.
  - Filter by category, ward, status, priority, and date.
- **Admin & Municipal Authority Dashboard**:
  - Side-by-side Before/After inspection for suspicious repairs with 1-click Override & Approve or Reject & Reopen.
  - Ward Executive Engineer contact directory.
- **Civic Intelligence & Transparency Hub**:
  - Recharts visual analytics showing resolution velocity, ward hotspots, pipeline distribution, and duplicate elimination efficiency.
- **Interactive 3-Minute Hackathon Demo Bar**:
  - Pinned control bar for judges with 1-click timer acceleration, synthetic fake-fix injection, and instant database reset.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM, Lucide React, Leaflet, React-Leaflet, Recharts, Canvas-Confetti |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLite (WAL mode), SQLAlchemy 2.0, Pydantic v2 |
| **AI / Computer Vision** | OpenCV (`opencv-python`), NumPy, Pillow, Perceptual Hashing (dHash), ORB Feature Matching, RANSAC Homography |
| **Integrations** | SMTP / Simulated Email Queue, X (Twitter) API v2 / Realistic Social Preview Bot, Optional Groq LLM API |

---

## 📂 Project Structure

```
civiceye-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry & CORS
│   │   ├── config.py                # Environment configuration
│   │   ├── database.py              # SQLite engine with WAL mode
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── user.py              # User roles (Citizen, Worker, Admin)
│   │   │   ├── issue.py             # Issue, IssueReport, IssueImage, Upvote
│   │   │   ├── verification.py      # RepairSubmission, AiVerification, CommunityVerification
│   │   │   └── escalation.py        # Escalation, MunicipalContact, AuditLog
│   │   ├── schemas/                 # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── duplicate_detector.py # Haversine GPS + OpenCV visual duplicate engine
│   │   │   ├── repair_verifier.py   # OpenCV RANSAC fake-fix CV detector
│   │   │   ├── priority_engine.py   # Dynamic 0-100 severity scoring
│   │   │   ├── escalation_engine.py # SLA 48h deadline checker & dispatcher
│   │   │   ├── email_service.py     # Municipal email generator
│   │   │   ├── x_service.py         # Public X bot generator
│   │   │   ├── image_utils.py       # Base64 decoding, dHash, and heatmap saver
│   │   │   └── demo_seed.py         # 14 realistic issues & synthetic textures
│   │   └── routers/                 # REST API endpoints
│   ├── uploads/                     # Before, After, and Heatmap images
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, DemoControlBar, StatusBadge, Maps, Modals
│   │   ├── pages/                   # Home, ReportIssue, CivicMap, IssueDetails, Admin, Worker, Analytics, Escalations
│   │   ├── context/                 # AuthContext (Role Switcher & Toasts)
│   │   ├── services/api.js          # Unified API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .env.example
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Python 3.10 or higher
- Node.js v18 or higher (v24 supported)
- npm v9 or higher

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend will start on `http://127.0.0.1:8000`. Database tables and 14 realistic demo issues will seed automatically on startup.

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend will be live on `http://localhost:5173`.

---

## 🎭 Pre-Configured Demo Personas

Switch between personas with 1-click in the top navigation bar:

| Persona | Name | Role | Department / Ward |
| :--- | :--- | :--- | :--- |
| **Citizen** | Priya Sharma | `citizen` | Ward 12 - Indiranagar (Level 3 Verifier) |
| **Worker** | Rajesh Kumar | `worker` | Roads & Public Infrastructure Maintenance Crew |
| **Admin** | Dr. Arvind Verma, IAS | `admin` | Office of the Municipal Commissioner |

---

## ⏱️ 3-Minute Hackathon Live Demonstration Script

Use the **Hackathon Live Demo Bar** pinned to the top of the interface:

1. **Step 1 — Report & Smart Duplicate Detection (0:00 - 0:45)**:
   - Click **"Report Issue"**.
   - Click the green button **"Demo: Test Duplicate Trigger (5th Cross)"**.
   - Click **"Register Public Grievance"**.
   - The **Smart Duplicate Detection Modal** will immediately trigger with **87% Match Confidence** (Location +40%, Category +20%, Visual AI +27%).
   - Click **"Yes, Merge with CIV-2026-0007 (+1 Voice)"**.
   - Notice the citizen report count increases from **56 → 57 Citizens Voiced**.

2. **Step 2 — 48-Hour SLA Expiration & Automated Escalation (0:45 - 1:30)**:
   - Open ticket **CIV-2026-0007**.
   - Observe the ticking countdown timer.
   - Click **"Simulate Timer Expiry (Escalate)"** in the top Demo Bar.
   - Watch the status immediately transition to **ESCALATED**.
   - Scroll down to view the generated **Official Grievance Email** to the Executive Engineer and the **Public X/Twitter Accountability Broadcast**.

3. **Step 3 — Worker Submits Fake Fix & AI Flagging (1:30 - 2:15)**:
   - Click **"Test AI Fake-Fix Detector"** in the top Demo Bar.
   - A simulated worker submission is uploaded with an indoor tiled floor photograph.
   - The **OpenCV AI Fake-Fix Detector** evaluates RANSAC keypoint homography, detects **Scene Match: 18%**, and flags **"Suspicious Repair Evidence"**.
   - The ticket status is routed to **Disputed (Manual Review Required)**.
   - Inspect the thermal difference heatmap overlay.

4. **Step 4 — Community Ground-Truth & Admin Resolution (2:15 - 3:00)**:
   - Switch role to **Admin (Dr. Arvind Verma)**.
   - Open **Admin Hub** → **AI Flagged Suspicious Repairs**.
   - Inspect the Before vs After discrepancy side-by-side.
   - Click **"Confirm Fake & Reject"** or switch to Citizen and cast a **Community Ground-Truth Vote**.
   - Once verified, ticket transitions to **RESOLVED ✓** with a permanent chronological audit trail.

---

## 🔒 Security & Privacy by Design

- **GDPR & Privacy Guardrails**: Public views, social posts, and grievance timelines never disclose citizen phone numbers, private emails, or personal home addresses.
- **Role Isolation**: Municipal workers are strictly prevented from self-marking complaints as resolved.
- **Upload Hardening**: Restricts uploads to validated image types with file size caps.
- **Environment Isolation**: All secrets and keys are read exclusively from `.env`.

---

## 📜 License
MIT License. Built for the 2026 Civic Technology & AI Accountability Hackathon.
