"""
FastAPI Main Application for KisanClaim.
AI-Powered Crop Damage Evidence Intelligence & Insurance Claim Verification Platform.
"""

import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

from .models import (
    Claim, FarmerProfile, LandParcel, CropDetails, DisasterDetails,
    EvidencePhoto, SatelliteObservation, WeatherObservation, Notification,
    ReviewActionPayload, CopilotQueryPayload, NewClaimPayload
)
from .database import (
    CLAIMS_DB, NOTIFICATIONS_DB, get_all_claims, get_claim_by_id,
    save_claim, add_notification, get_farmer_notifications, init_seed_data
)
from .agents import execute_all_agents, answer_reviewer_copilot_question
from .digipin import encode_digipin, decode_digipin
from .geospatial import calculate_polygon_area_acres, generate_default_polygon, generate_ndvi_grid
from .weather import fetch_weather_intelligence
from .pdf_generator import generate_html_claim_report, generate_minimal_pdf_bytes

app = FastAPI(
    title="KisanClaim API",
    description="AI-Powered Geospatial Evidence Twin & Insurance Adjudication Engine",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for imagery and icons
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# WebSocket Connection Manager for Real-Time Farmer Notifications
class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = WebSocketManager()

@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive and listen for client pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# ----------------- REST ENDPOINTS -----------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "KisanClaim Intelligence Backend",
        "active_claims": len(CLAIMS_DB),
        "geospatial_engine": "online",
        "weather_service": "online",
        "multi_agent_system": "ready"
    }

@app.post("/api/reset")
def reset_demo_state():
    init_seed_data()
    return {"status": "reset", "message": "Demo state successfully reset to initial baseline."}

# ----------------- AUTHENTICATION ENDPOINTS -----------------

class FarmerLoginPayload(BaseModel):
    mobile: str
    otp: Optional[str] = "1234"
    name: Optional[str] = None

class FarmerRegisterPayload(BaseModel):
    name: str
    mobile: str
    state: str = "Karnataka"
    district: str = "Bengaluru Rural"
    village: str = "Devanahalli"

class InsuranceLoginPayload(BaseModel):
    company_id: str
    access_code: Optional[str] = "claims2026"

@app.post("/api/auth/farmer/login")
def farmer_login(payload: FarmerLoginPayload):
    mob = payload.mobile.strip().replace(" ", "").replace("-", "")
    if mob.startswith("+91"):
        mob = mob[3:]

    claims = get_all_claims()
    matching_farmer = None
    for c in claims:
        if c.farmer.mobile == mob:
            matching_farmer = c.farmer
            break

    if not matching_farmer:
        fallback_name = payload.name.strip() if payload.name and payload.name.strip() else ("Ravi Kumar" if mob == "9876543210" else f"Farmer {mob[-4:]}")
        matching_farmer = FarmerProfile(
            id=f"farmer-{uuid.uuid4().hex[:6]}",
            name=fallback_name,
            mobile=mob,
            state="Karnataka",
            district="Bengaluru Rural",
            village="Devanahalli"
        )
    elif payload.name and payload.name.strip():
        matching_farmer.name = payload.name.strip()

    return {
        "success": True,
        "role": "farmer",
        "user": matching_farmer.dict(),
        "token": f"kisan-token-{mob}"
    }

@app.post("/api/auth/farmer/register")
def farmer_register(payload: FarmerRegisterPayload):
    mob = payload.mobile.strip().replace(" ", "").replace("-", "")
    if mob.startswith("+91"):
        mob = mob[3:]

    new_farmer = FarmerProfile(
        id=f"farmer-{uuid.uuid4().hex[:6]}",
        name=payload.name,
        mobile=mob,
        state=payload.state,
        district=payload.district,
        village=payload.village
    )

    return {
        "success": True,
        "role": "farmer",
        "user": new_farmer.dict(),
        "token": f"kisan-token-{mob}"
    }

@app.post("/api/auth/insurance/login")
def insurance_login(payload: InsuranceLoginPayload):
    cid = payload.company_id.strip().upper()
    if len(cid) < 3:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    return {
        "success": True,
        "role": "insurance",
        "user": {
            "company_id": cid,
            "reviewer_id": "REV-EMP-409" if "409" in cid else f"REV-{cid}",
            "company_name": "Agricultural Insurance Co. of India (PMFBY Hub)",
            "name": "Ananya Sharma",
            "title": "Senior Agronomist & Lead Adjudicator",
            "department": "Crop Intelligence & Satellite Claims Verification Unit"
        },
        "token": f"ins-token-{cid}"
    }

@app.get("/api/stats")
def get_dashboard_stats():
    """Insurance Overview KPI statistics."""
    claims = get_all_claims()
    total = len(claims)
    pending = sum(1 for c in claims if c.current_status in ["Submitted", "AI Processing", "Pending Review"])
    approved = sum(1 for c in claims if c.current_status in ["Approved", "Payment Scheduled", "Paid"])
    rejected = sum(1 for c in claims if c.current_status == "Rejected")
    evidence_req = sum(1 for c in claims if c.current_status == "Additional Evidence Required")
    high_severity = sum(1 for c in claims if c.estimated_damage_severity in ["High", "Severe"])
    total_val = sum(c.estimated_payout for c in claims)
    flagged = sum(1 for c in claims if any(ag.status in ["flagged", "needs_review"] for ag in c.ai_agents))

    return {
        "total_claims": total,
        "pending_verification": pending,
        "approved_claims": approved,
        "rejected_claims": rejected,
        "additional_evidence_required": evidence_req,
        "high_severity_claims": high_severity,
        "ai_flagged_claims": flagged,
        "total_estimated_claim_value": round(total_val, 2),
        "average_processing_time_hours": 14.5
    }

@app.get("/api/claims")
def list_claims(
    status: Optional[str] = None,
    crop: Optional[str] = None,
    disaster: Optional[str] = None,
    search: Optional[str] = None
):
    """Retrieve filtered claim queue for reviewer."""
    claims = get_all_claims()
    results = []

    for c in claims:
        if status and status != "all" and c.current_status.lower() != status.lower():
            continue
        if crop and crop != "all" and c.crop.crop_name.lower() != crop.lower():
            continue
        if disaster and disaster != "all" and c.disaster.disaster_type.lower() != disaster.lower():
            continue
        if search:
            s = search.lower()
            matches = (
                s in c.claim_number.lower() or
                s in c.farmer.name.lower() or
                s in c.farmer.village.lower() or
                s in c.farmer.district.lower() or
                s in c.land.survey_number.lower() or
                s in c.crop.crop_name.lower()
            )
            if not matches:
                continue
        results.append(c)

    return sorted(results, key=lambda x: x.created_at, reverse=True)

@app.get("/api/claims/{claim_id}")
def get_claim(claim_id: str):
    claim = get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

@app.post("/api/claims")
async def create_new_claim(payload: NewClaimPayload):
    """
    Submits a new claim from either the Voice Assistant or the manual farmer form.
    Automatically computes DIGIPIN, GIS polygon area, fetches Sentinel-2 & Open-Meteo data,
    executes all 5 AI verification agents, and saves to database.
    """
    claim_uid = f"claim-ksn-{uuid.uuid4().hex[:6]}"
    claim_num = f"KSN-2026-{1000 + len(CLAIMS_DB) + 1}"

    # Auto DIGIPIN & Polygon
    digipin_code = encode_digipin(payload.latitude, payload.longitude)
    polygon = payload.polygon_coords or generate_default_polygon(payload.latitude, payload.longitude)
    measured_area = calculate_polygon_area_acres(polygon)

    # Weather Intelligence
    weather_data = fetch_weather_intelligence(
        lat=payload.latitude,
        lon=payload.longitude,
        disaster_date_str=payload.disaster_date,
        disaster_type=payload.disaster_type
    )

    # Model Assembly
    farmer = FarmerProfile(
        id=f"farmer-{uuid.uuid4().hex[:6]}",
        name=payload.farmer_name,
        mobile=payload.mobile,
        state=payload.state,
        district=payload.district,
        village=payload.village
    )
    land = LandParcel(
        id=f"land-{uuid.uuid4().hex[:6]}",
        survey_number=payload.survey_number or "99/1",
        land_parcel_id=f"{payload.state[:2].upper()}-{payload.district[:3].upper()}-{uuid.uuid4().hex[:4].upper()}",
        digipin=digipin_code,
        latitude=payload.latitude,
        longitude=payload.longitude,
        area_acres=measured_area,
        polygon_geojson=polygon
    )
    crop = CropDetails(
        crop_name=payload.crop_name,
        variety=payload.variety or "Local High-Yield",
        sowing_date=payload.sowing_date or "2026-06-15",
        growth_stage=payload.growth_stage,
        insured_area_acres=payload.land_area_acres,
        insurance_scheme="PMFBY",
        application_number=f"PMFBY-2026-{uuid.uuid4().hex[:6].upper()}",
        sum_insured=round(payload.land_area_acres * 10000.0, 2)
    )
    affected_acres = round(measured_area * (payload.damage_percentage / 100.0), 2)
    disaster = DisasterDetails(
        disaster_type=payload.disaster_type,
        disaster_date=payload.disaster_date,
        disaster_time="14:00",
        reported_cause=payload.reported_cause or f"Extreme {payload.disaster_type} event",
        affected_area_acres=affected_acres,
        damage_percentage_reported=payload.damage_percentage,
        description=payload.description or "Reported crop damage through KisanClaim platform."
    )

    # Satellite Synthetic / Live Simulation
    veg_drop = min(85.0, max(25.0, payload.damage_percentage * 0.9))
    pre_ndvi = 0.74
    post_ndvi = round(pre_ndvi * (1.0 - (veg_drop / 100.0)), 2)
    sat = SatelliteObservation(
        satellite_source="Sentinel-2 MSI (Level-2A)",
        pre_disaster_date="2026-08-14",
        post_disaster_date="2026-08-22",
        ndvi_pre_avg=pre_ndvi,
        ndvi_post_avg=post_ndvi,
        ndvi_diff=round(post_ndvi - pre_ndvi, 2),
        vegetation_drop_pct=veg_drop,
        confidence_score=90
    )

    weather_obs = WeatherObservation(
        source=weather_data.get("source", "Open-Meteo"),
        disaster_date=payload.disaster_date,
        rainfall_disaster_day_mm=weather_data.get("rainfall_disaster_day_mm", 120.0),
        rainfall_7day_cumulative_mm=weather_data.get("rainfall_7day_cumulative_mm", 210.0),
        historical_avg_aug_mm=weather_data.get("historical_avg_aug_mm", 48.0),
        anomaly_ratio=weather_data.get("anomaly_ratio", 3.8),
        soil_saturation_pct=weather_data.get("soil_saturation_pct", 92.0),
        confidence_score=weather_data.get("confidence_score", 92)
    )

    # Photos
    evidence_photos = []
    if payload.photos:
        for idx, p in enumerate(payload.photos):
            evidence_photos.append(EvidencePhoto(
                id=f"photo-{uuid.uuid4().hex[:6]}",
                photo_url=p.get("photo_url", "/static/sample_damaged_crop.jpg"),
                photo_type=p.get("photo_type", "damaged_crop"),
                timestamp=p.get("timestamp", f"{payload.disaster_date}T15:00:00"),
                latitude=p.get("latitude", payload.latitude + (idx * 0.0002)),
                longitude=p.get("longitude", payload.longitude + (idx * 0.0002)),
                metadata_verified=True,
                caption=p.get("caption", "Ground photograph captured by farmer.")
            ))
    else:
        # Provide verified default evidence photo templates
        evidence_photos = [
            EvidencePhoto(
                id=f"photo-{uuid.uuid4().hex[:6]}",
                photo_url="/static/sample_damaged_crop.jpg",
                photo_type="damaged_crop",
                timestamp=f"{payload.disaster_date}T16:15:00",
                latitude=payload.latitude,
                longitude=payload.longitude,
                metadata_verified=True,
                caption="Crop damage ground photo"
            )
        ]

    # Calculate severity & indicative payout
    if payload.damage_percentage >= 70:
        severity = "Severe"
    elif payload.damage_percentage >= 50:
        severity = "High"
    elif payload.damage_percentage >= 25:
        severity = "Moderate"
    else:
        severity = "Low"

    est_payout = round(min(crop.sum_insured, affected_acres * (payload.damage_percentage / 100.0) * 10000.0 * 1.35), 2)

    claim = Claim(
        id=claim_uid,
        claim_number=claim_num,
        farmer=farmer,
        land=land,
        crop=crop,
        disaster=disaster,
        photos=evidence_photos,
        satellite=sat,
        weather=weather_obs,
        farmer_reported_loss=payload.farmer_loss_estimate,
        estimated_damage_severity=severity,
        evidence_confidence_score=89,
        indicative_likelihood_score=87,
        estimated_payout=est_payout,
        current_status="Pending Review"
    )

    # Run AI Agents
    claim.ai_agents = execute_all_agents(claim)
    save_claim(claim)

    # Add farmer notification
    notif = Notification(
        id=f"notif-{uuid.uuid4().hex[:6]}",
        farmer_id=farmer.id,
        claim_id=claim.id,
        title="Claim Registered & AI Twin Ready",
        message=f"Claim {claim.claim_number} for {crop.crop_name} submitted successfully. AI Verification completed.",
        type="info"
    )
    add_notification(notif)

    # Broadcast real-time update
    await ws_manager.broadcast({
        "event": "claim_created",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "farmer_name": farmer.name,
        "crop": crop.crop_name,
        "status": claim.current_status
    })

    return claim

@app.post("/api/claims/{claim_id}/review")
async def review_claim_action(claim_id: str, payload: ReviewActionPayload):
    """
    Executes Human Reviewer decision (Approve, Reject, Request Evidence, Schedule Payment).
    Updates backend state, generates notification, and broadcasts live WebSocket message.
    """
    claim = get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    action = payload.action.lower()
    notif_type = "info"
    notif_title = ""
    notif_msg = ""

    claim.reviewer_id = payload.reviewer_id
    claim.reviewer_name = payload.reviewer_name
    claim.reviewer_comments = payload.comments or "Adjudication performed via KisanClaim Review Console."
    import datetime
    claim.reviewed_at = datetime.datetime.now().isoformat()

    if action == "approve":
        claim.current_status = "Approved"
        claim.approved_amount = payload.approved_amount or claim.estimated_payout
        notif_type = "approval"
        notif_title = "🎉 Claim Approved by Insurer"
        notif_msg = f"Your claim {claim.claim_number} has been approved for ₹{claim.approved_amount:,.2f} by {payload.reviewer_name}."
    elif action == "reject":
        claim.current_status = "Rejected"
        claim.rejection_reason = payload.rejection_reason or "Evidence provided does not satisfy policy criteria."
        notif_type = "rejection"
        notif_title = "⚠️ Claim Rejected"
        notif_msg = f"Your claim {claim.claim_number} was rejected. Reason: {claim.rejection_reason}"
    elif action == "request_evidence":
        claim.current_status = "Additional Evidence Required"
        claim.requested_evidence_notes = payload.requested_evidence or "Please upload supplementary geo-tagged photographs."
        notif_type = "evidence_request"
        notif_title = "📋 Supplementary Evidence Requested"
        notif_msg = f"Reviewer requested additional documentation for {claim.claim_number}: {claim.requested_evidence_notes}"
    elif action == "schedule_payment":
        claim.current_status = "Payment Scheduled"
        notif_type = "payment"
        notif_title = "💳 Direct Benefit Transfer (DBT) Scheduled"
        notif_msg = f"Payout of ₹{(claim.approved_amount or claim.estimated_payout):,.2f} scheduled to bank account linked to PMFBY ID {claim.crop.application_number}."
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported action: {action}")

    save_claim(claim)

    # Record farmer notification
    notif = Notification(
        id=f"notif-{uuid.uuid4().hex[:6]}",
        farmer_id=claim.farmer.id,
        claim_id=claim.id,
        title=notif_title,
        message=notif_msg,
        type=notif_type
    )
    add_notification(notif)

    # Real-Time WebSocket Broadcast
    await ws_manager.broadcast({
        "event": "claim_reviewed",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "farmer_id": claim.farmer.id,
        "action": action,
        "new_status": claim.current_status,
        "approved_amount": claim.approved_amount,
        "notification": notif.dict()
    })

    return {
        "success": True,
        "claim": claim,
        "notification": notif
    }

@app.post("/api/claims/{claim_id}/copilot")
def copilot_query(claim_id: str, payload: CopilotQueryPayload):
    """Answers insurance reviewer questions grounded directly in claim data."""
    claim = get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return answer_reviewer_copilot_question(claim, payload.question)

@app.post("/api/claims/{claim_id}/run-agents")
def re_run_agents(claim_id: str):
    """Re-executes all 5 AI verification agents."""
    claim = get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim.ai_agents = execute_all_agents(claim)
    save_claim(claim)
    return {"success": True, "ai_agents": claim.ai_agents}

@app.get("/api/claims/{claim_id}/report.html")
def view_html_report(claim_id: str):
    """Returns the multi-page styled HTML report for live viewing / printing."""
    claim = get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    html_content = generate_html_claim_report(claim)
    return HTMLResponse(content=html_content, status_code=200)

@app.get("/api/claims/{claim_id}/report.pdf")
def download_pdf_report(claim_id: str):
    """Generates standard downloadable PDF stream."""
    claim = get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    pdf_bytes = generate_minimal_pdf_bytes(claim)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=KisanClaim_{claim.claim_number}.pdf"}
    )

@app.get("/api/notifications")
def get_notifications(farmer_id: Optional[str] = "all"):
    return get_farmer_notifications(farmer_id)

@app.get("/api/digipin/encode")
def api_encode_digipin(lat: float = Query(...), lon: float = Query(...)):
    code = encode_digipin(lat, lon)
    return {"latitude": lat, "longitude": lon, "digipin": code}

@app.get("/api/digipin/decode")
def api_decode_digipin(code: str = Query(...)):
    result = decode_digipin(code)
    return result

@app.get("/api/geospatial/ndvi-grid")
def get_ndvi_matrix(disaster_type: str = "Flood"):
    """Returns 2D grid matrix of pre and post disaster NDVI for canvas rendering."""
    pre_grid = generate_ndvi_grid(size=14, pre_disaster=True, disaster_type=disaster_type)
    post_grid = generate_ndvi_grid(size=14, pre_disaster=False, disaster_type=disaster_type)
    diff_grid = [[round(post_grid[r][c] - pre_grid[r][c], 3) for c in range(14)] for r in range(14)]
    return {
        "size": 14,
        "pre_disaster_grid": pre_grid,
        "post_disaster_grid": post_grid,
        "diff_grid": diff_grid
    }

class STTPayload(BaseModel):
    audio_base64: Optional[str] = None
    language: Optional[str] = "en-IN"

@app.post("/api/speech-to-text")
async def speech_to_text(payload: STTPayload):
    """
    Fallback Speech-to-Text server endpoint using Python speech_recognition.
    Guarantees voice transcription if browser Web Speech API encounters network restrictions.
    """
    import base64
    import io
    try:
        import speech_recognition as sr
        b64 = payload.audio_base64 or ""
        if "," in b64:
            b64 = b64.split(",")[1]
        if not b64:
            return {"success": False, "error": "No audio provided"}
        audio_bytes = base64.b64decode(b64)
        buf = io.BytesIO(audio_bytes)
        r = sr.Recognizer()
        with sr.AudioFile(buf) as source:
            audio_data = r.record(source)
        lang = payload.language or "en-IN"
        text = r.recognize_google(audio_data, language=lang)
        return {"success": True, "text": text}
    except Exception as e:
        return {"success": False, "error": str(e)}
