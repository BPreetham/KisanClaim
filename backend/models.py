from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class FarmerProfile(BaseModel):
    id: str
    name: str
    mobile: str
    state: str = "Karnataka"
    district: str = "Bengaluru Rural"
    village: str = "Devanahalli"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class LandParcel(BaseModel):
    id: str
    survey_number: str = "125/2"
    land_parcel_id: str = "KA-BLR-1025"
    digipin: str = "562C-8F29-KM"
    latitude: float = 13.2456
    longitude: float = 77.7123
    area_acres: float = 2.5
    polygon_geojson: Optional[List[List[float]]] = None

class CropDetails(BaseModel):
    crop_name: str = "Ragi"
    variety: Optional[str] = "GPU-28"
    sowing_date: str = "2026-06-15"
    expected_harvest: Optional[str] = "2026-10-15"
    growth_stage: str = "Vegetative"
    insured_area_acres: float = 2.5
    insurance_scheme: str = "PMFBY"
    application_number: str = "PMFBY-2026-1025"
    sum_insured: float = 25000.0

class DisasterDetails(BaseModel):
    disaster_type: str = "Flood"
    disaster_date: str = "2026-08-20"
    disaster_time: Optional[str] = "15:30"
    reported_cause: str = "Heavy rainfall and localized flash runoff"
    affected_area_acres: float = 1.8
    damage_percentage_reported: float = 70.0
    description: str = "Field submerged for two days due to heavy rainfall."

class EvidencePhoto(BaseModel):
    id: str
    photo_url: str
    photo_type: str = "damaged_crop"  # damaged_crop, waterlogging, field_overview
    timestamp: str
    latitude: float
    longitude: float
    metadata_verified: bool = True
    is_simulated: bool = False
    caption: Optional[str] = None

class SatelliteObservation(BaseModel):
    satellite_source: str = "Sentinel-2 MSI (Level-2A)"
    pre_disaster_date: str = "2026-08-14"
    post_disaster_date: str = "2026-08-22"
    ndvi_pre_avg: float = 0.74
    ndvi_post_avg: float = 0.28
    ndvi_diff: float = -0.46
    vegetation_drop_pct: float = 62.16
    flood_water_index_ndwi: float = 0.48
    confidence_score: int = 91
    is_simulated: bool = True
    limitations: str = "Cloud cover on 2026-08-20 necessitated acquisition from adjacent orbits (Aug 14 and Aug 22)."

class WeatherObservation(BaseModel):
    source: str = "Open-Meteo & IMD Gridded Reanalysis"
    disaster_date: str = "2026-08-20"
    rainfall_disaster_day_mm: float = 142.5
    rainfall_7day_cumulative_mm: float = 238.0
    historical_avg_aug_mm: float = 48.0
    anomaly_ratio: float = 4.95
    soil_saturation_pct: float = 96.0
    confidence_score: int = 94

class AIAgentFinding(BaseModel):
    agent_id: str
    agent_name: str
    agent_role: str
    status: str  # passed, flagged, needs_review
    score: int   # 0 to 100
    risk_level: str  # low, medium, high
    summary: str
    findings: List[str]
    supporting_evidence: List[str]
    contradicting_evidence: List[str]
    explanation: str
    recommended_action: str

class Claim(BaseModel):
    id: str
    claim_number: str
    farmer: FarmerProfile
    land: LandParcel
    crop: CropDetails
    disaster: DisasterDetails
    photos: List[EvidencePhoto] = []
    satellite: SatelliteObservation
    weather: WeatherObservation
    ai_agents: List[AIAgentFinding] = []
    
    # Financial and Assessment summary
    farmer_reported_loss: float = 18000.0
    estimated_damage_severity: str = "High"  # Low, Moderate, High, Severe
    evidence_confidence_score: int = 89     # 0-100
    indicative_likelihood_score: int = 88   # 0-100
    estimated_payout: float = 17500.0
    payout_calculation_notes: str = "Calculated as: Insured Area (2.5 ac) × Damage % (70%) × PMFBY Scale of Finance (₹10,000/ac max payable ₹17,500 capped at Sum Insured)."

    # Workflow & Review
    current_status: str = "Pending Review"  # Submitted, AI Processing, Pending Review, Additional Evidence Required, Approved, Rejected, Payment Scheduled, Paid
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    reviewer_comments: Optional[str] = None
    approved_amount: Optional[float] = None
    rejection_reason: Optional[str] = None
    requested_evidence_notes: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class Notification(BaseModel):
    id: str
    farmer_id: str
    claim_id: str
    title: str
    message: str
    type: str  # approval, rejection, evidence_request, payment, info
    read: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class ReviewActionPayload(BaseModel):
    action: str  # approve, reject, request_evidence, schedule_payment
    reviewer_id: str = "REV-EMP-409"
    reviewer_name: str = "Ananya Sharma (Senior Agronomist & Claims Lead)"
    comments: Optional[str] = None
    approved_amount: Optional[float] = None
    rejection_reason: Optional[str] = None
    requested_evidence: Optional[str] = None

class CopilotQueryPayload(BaseModel):
    claim_id: str
    question: str

class NewClaimPayload(BaseModel):
    farmer_name: str
    mobile: str
    state: str = "Karnataka"
    district: str = "Bengaluru Rural"
    village: str = "Devanahalli"
    survey_number: Optional[str] = "125/2"
    land_area_acres: float = 2.5
    latitude: float = 13.2456
    longitude: float = 77.7123
    polygon_coords: Optional[List[List[float]]] = None
    crop_name: str = "Ragi"
    variety: Optional[str] = "GPU-28"
    sowing_date: Optional[str] = "2026-06-15"
    growth_stage: str = "Vegetative"
    disaster_type: str = "Flood"
    disaster_date: str = "2026-08-20"
    reported_cause: Optional[str] = "Heavy rainfall and localized flooding"
    damage_percentage: float = 70.0
    farmer_loss_estimate: float = 18000.0
    description: Optional[str] = "Field was submerged under 2 feet of water following cloudburst."
    photos: Optional[List[Dict[str, Any]]] = []
