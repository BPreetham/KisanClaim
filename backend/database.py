"""
Database & Persistence Layer for KisanClaim.
Stores claims, farmers, review actions, and notifications in memory
with automatic JSON disk persistence.
Preloaded with the hackathon demo story (Ravi Kumar - KSN-1025)
plus 6 additional realistic claims across diverse crops, disasters, and districts.
"""

import json
import os
from typing import Dict, List, Optional
from datetime import datetime
from .models import (
    Claim, FarmerProfile, LandParcel, CropDetails, DisasterDetails,
    EvidencePhoto, SatelliteObservation, WeatherObservation, Notification
)
from .agents import execute_all_agents
from .geospatial import generate_default_polygon
from .digipin import encode_digipin

DB_FILE = os.path.join(os.path.dirname(__file__), "kisanclaim_db.json")

# In-memory stores
CLAIMS_DB: Dict[str, Claim] = {}
NOTIFICATIONS_DB: List[Notification] = []

def init_seed_data():
    """Populates realistic claims and initial state."""
    global CLAIMS_DB, NOTIFICATIONS_DB

    # 1. PRIMARY DEMO CLAIM: Ravi Kumar (Ragi, Flood, Devanahalli)
    claim_1025_id = "claim-ksn-1025"
    farmer_1025 = FarmerProfile(
        id="farmer-ksn-1025",
        name="Ravi Kumar",
        mobile="9876543210",
        state="Karnataka",
        district="Bengaluru Rural",
        village="Devanahalli"
    )
    land_1025 = LandParcel(
        id="land-ka-blr-1025",
        survey_number="125/2",
        land_parcel_id="KA-BLR-1025",
        digipin=encode_digipin(13.2456, 77.7123),
        latitude=13.2456,
        longitude=77.7123,
        area_acres=2.5,
        polygon_geojson=generate_default_polygon(13.2456, 77.7123)
    )
    crop_1025 = CropDetails(
        crop_name="Ragi",
        variety="GPU-28",
        sowing_date="2026-06-15",
        expected_harvest="2026-10-15",
        growth_stage="Vegetative",
        insured_area_acres=2.5,
        insurance_scheme="PMFBY",
        application_number="PMFBY-2026-1025",
        sum_insured=25000.0
    )
    disaster_1025 = DisasterDetails(
        disaster_type="Flood",
        disaster_date="2026-08-20",
        disaster_time="15:30",
        reported_cause="Heavy rainfall causing localized overflow from irrigation bund",
        affected_area_acres=1.8,
        damage_percentage_reported=70.0,
        description="My ragi field was completely submerged in water for two days due to heavy rainfall."
    )
    photos_1025 = [
        EvidencePhoto(
            id="photo-1025-1",
            photo_url="/static/sample_damaged_crop.jpg",
            photo_type="damaged_crop",
            timestamp="2026-08-20T16:15:00",
            latitude=13.2458,
            longitude=77.7121,
            metadata_verified=True,
            caption="Lodged ragi plants submerged under murky flood sediment."
        ),
        EvidencePhoto(
            id="photo-1025-2",
            photo_url="/static/sample_flood_water.jpg",
            photo_type="waterlogging",
            timestamp="2026-08-20T16:22:00",
            latitude=13.2452,
            longitude=77.7126,
            metadata_verified=True,
            caption="Deep standing water pooling across furrow channels."
        ),
        EvidencePhoto(
            id="photo-1025-3",
            photo_url="/static/sample_field_overview.jpg",
            photo_type="field_overview",
            timestamp="2026-08-20T16:28:00",
            latitude=13.2456,
            longitude=77.7123,
            metadata_verified=True,
            caption="Panoramic view along eastern perimeter showing complete vegetative loss."
        )
    ]
    sat_1025 = SatelliteObservation(
        satellite_source="Sentinel-2 MSI (Level-2A)",
        pre_disaster_date="2026-08-14",
        post_disaster_date="2026-08-22",
        ndvi_pre_avg=0.74,
        ndvi_post_avg=0.28,
        ndvi_diff=-0.46,
        vegetation_drop_pct=62.16,
        flood_water_index_ndwi=0.48,
        confidence_score=91,
        is_simulated=True
    )
    weather_1025 = WeatherObservation(
        source="Open-Meteo & IMD Gridded Reanalysis",
        disaster_date="2026-08-20",
        rainfall_disaster_day_mm=142.5,
        rainfall_7day_cumulative_mm=238.0,
        historical_avg_aug_mm=48.0,
        anomaly_ratio=4.95,
        soil_saturation_pct=96.0,
        confidence_score=94
    )

    claim_1025 = Claim(
        id=claim_1025_id,
        claim_number="KSN-2026-1025",
        farmer=farmer_1025,
        land=land_1025,
        crop=crop_1025,
        disaster=disaster_1025,
        photos=photos_1025,
        satellite=sat_1025,
        weather=weather_1025,
        farmer_reported_loss=18000.0,
        estimated_damage_severity="High",
        evidence_confidence_score=89,
        indicative_likelihood_score=88,
        estimated_payout=17500.0,
        current_status="Pending Review",
        created_at="2026-08-21T09:40:00"
    )
    claim_1025.ai_agents = execute_all_agents(claim_1025)
    CLAIMS_DB[claim_1025_id] = claim_1025

    # 2. CLAIM 1088: Suresh Patil (Sugarcane, Belagavi, Severe Flood)
    claim_1088_id = "claim-ksn-1088"
    claim_1088 = Claim(
        id=claim_1088_id,
        claim_number="KSN-2026-1088",
        farmer=FarmerProfile(id="farmer-1088", name="Suresh Patil", mobile="9845123456", state="Karnataka", district="Belagavi", village="Chikkodi"),
        land=LandParcel(id="land-1088", survey_number="48/1A", land_parcel_id="KA-BEL-1088", digipin=encode_digipin(16.4312, 74.5982), latitude=16.4312, longitude=74.5982, area_acres=4.0, polygon_geojson=generate_default_polygon(16.4312, 74.5982)),
        crop=CropDetails(crop_name="Sugarcane", variety="Co-86032", sowing_date="2026-03-10", growth_stage="Flowering stage", insured_area_acres=4.0, sum_insured=60000.0, application_number="PMFBY-2026-1088"),
        disaster=DisasterDetails(disaster_type="Flood", disaster_date="2026-08-18", reported_cause="Krishna river backwater breach", affected_area_acres=3.6, damage_percentage_reported=85.0, description="River water inundated entire cane crop for 96 hours."),
        satellite=SatelliteObservation(pre_disaster_date="2026-08-10", post_disaster_date="2026-08-22", ndvi_pre_avg=0.82, ndvi_post_avg=0.21, ndvi_diff=-0.61, vegetation_drop_pct=74.39, confidence_score=94),
        weather=WeatherObservation(disaster_date="2026-08-18", rainfall_disaster_day_mm=186.0, rainfall_7day_cumulative_mm=380.0, historical_avg_aug_mm=62.0, anomaly_ratio=6.1, soil_saturation_pct=99.0),
        farmer_reported_loss=55000.0,
        estimated_damage_severity="Severe",
        evidence_confidence_score=94,
        indicative_likelihood_score=92,
        estimated_payout=51000.0,
        current_status="Approved",
        reviewer_id="REV-EMP-409",
        reviewer_name="Ananya Sharma",
        approved_amount=51000.0,
        reviewer_comments="Conclusive Krishna basin satellite inundation footprint verified. Direct payment fast-tracked.",
        reviewed_at="2026-08-22T14:30:00"
    )
    claim_1088.ai_agents = execute_all_agents(claim_1088)
    CLAIMS_DB[claim_1088_id] = claim_1088

    # 3. CLAIM 1042: Ramesh Gowda (Paddy, Mandya, Severe Drought)
    claim_1042_id = "claim-ksn-1042"
    claim_1042 = Claim(
        id=claim_1042_id,
        claim_number="KSN-2026-1042",
        farmer=FarmerProfile(id="farmer-1042", name="Ramesh Gowda", mobile="9448765432", state="Karnataka", district="Mandya", village="Maddur"),
        land=LandParcel(id="land-1042", survey_number="210/3", land_parcel_id="KA-MDY-1042", digipin=encode_digipin(12.5841, 77.0429), latitude=12.5841, longitude=77.0429, area_acres=3.0, polygon_geojson=generate_default_polygon(12.5841, 77.0429)),
        crop=CropDetails(crop_name="Paddy", variety="JGL-1798", sowing_date="2026-06-20", growth_stage="Flowering stage", insured_area_acres=3.0, sum_insured=35000.0, application_number="PMFBY-2026-1042"),
        disaster=DisasterDetails(disaster_type="Drought", disaster_date="2026-08-25", reported_cause="Monsoon failure / no canal release for 35 days", affected_area_acres=2.5, damage_percentage_reported=60.0, description="Canal dried up; vegetative tillers withered in extreme heat."),
        satellite=SatelliteObservation(pre_disaster_date="2026-07-28", post_disaster_date="2026-08-26", ndvi_pre_avg=0.68, ndvi_post_avg=0.31, ndvi_diff=-0.37, vegetation_drop_pct=54.4, confidence_score=88),
        weather=WeatherObservation(disaster_date="2026-08-25", rainfall_disaster_day_mm=0.0, rainfall_7day_cumulative_mm=1.2, historical_avg_aug_mm=85.0, anomaly_ratio=0.05, soil_saturation_pct=14.0),
        farmer_reported_loss=26000.0,
        estimated_damage_severity="High",
        evidence_confidence_score=87,
        indicative_likelihood_score=84,
        estimated_payout=21000.0,
        current_status="Pending Review"
    )
    claim_1042.ai_agents = execute_all_agents(claim_1042)
    CLAIMS_DB[claim_1042_id] = claim_1042

    # 4. CLAIM 1104: Anita Devi (Onion, Nashik, Hailstorm)
    claim_1104_id = "claim-ksn-1104"
    claim_1104 = Claim(
        id=claim_1104_id,
        claim_number="KSN-2026-1104",
        farmer=FarmerProfile(id="farmer-1104", name="Anita Devi", mobile="9123456780", state="Maharashtra", district="Nashik", village="Lasalgaon"),
        land=LandParcel(id="land-1104", survey_number="89/4", land_parcel_id="MH-NSK-1104", digipin=encode_digipin(20.1432, 74.2251), latitude=20.1432, longitude=74.2251, area_acres=2.0, polygon_geojson=generate_default_polygon(20.1432, 74.2251)),
        crop=CropDetails(crop_name="Onion", variety="Bhima Dark Red", sowing_date="2026-07-01", growth_stage="Fruiting stage", insured_area_acres=2.0, sum_insured=30000.0, application_number="PMFBY-2026-1104"),
        disaster=DisasterDetails(disaster_type="Hailstorm", disaster_date="2026-08-22", reported_cause="Severe unseasonal hailstones shredded onion leaves", affected_area_acres=1.5, damage_percentage_reported=55.0, description="Hailstorm shredded standing crop canopy causing fungal rot."),
        satellite=SatelliteObservation(pre_disaster_date="2026-08-15", post_disaster_date="2026-08-24", ndvi_pre_avg=0.69, ndvi_post_avg=0.34, ndvi_diff=-0.35, vegetation_drop_pct=50.7, confidence_score=86),
        weather=WeatherObservation(disaster_date="2026-08-22", rainfall_disaster_day_mm=62.0, rainfall_7day_cumulative_mm=78.0, historical_avg_aug_mm=55.0, anomaly_ratio=2.8, soil_saturation_pct=72.0),
        farmer_reported_loss=20000.0,
        estimated_damage_severity="Moderate",
        evidence_confidence_score=85,
        indicative_likelihood_score=82,
        estimated_payout=16500.0,
        current_status="Additional Evidence Required",
        requested_evidence_notes="Reviewer requested close-up photo of onion bulbs to assess underground rotting index."
    )
    claim_1104.ai_agents = execute_all_agents(claim_1104)
    CLAIMS_DB[claim_1104_id] = claim_1104

    # 5. CLAIM 1150: Gurpreet Singh (Wheat, Ludhiana, Pest Attack)
    claim_1150_id = "claim-ksn-1150"
    claim_1150 = Claim(
        id=claim_1150_id,
        claim_number="KSN-2026-1150",
        farmer=FarmerProfile(id="farmer-1150", name="Gurpreet Singh", mobile="9814012345", state="Punjab", district="Ludhiana", village="Khanna"),
        land=LandParcel(id="land-1150", survey_number="312/1", land_parcel_id="PB-LDH-1150", digipin=encode_digipin(30.7046, 76.2163), latitude=30.7046, longitude=76.2163, area_acres=5.0, polygon_geojson=generate_default_polygon(30.7046, 76.2163)),
        crop=CropDetails(crop_name="Wheat", variety="HD-3086", sowing_date="2026-05-10", growth_stage="Near harvest", insured_area_acres=5.0, sum_insured=75000.0, application_number="PMFBY-2026-1150"),
        disaster=DisasterDetails(disaster_type="Pest attack", disaster_date="2026-08-15", reported_cause="Yellow rust epidemic across block", affected_area_acres=2.2, damage_percentage_reported=40.0, description="Yellow rust pustules covered wheat leaves, shriveling grain."),
        satellite=SatelliteObservation(pre_disaster_date="2026-08-05", post_disaster_date="2026-08-18", ndvi_pre_avg=0.72, ndvi_post_avg=0.48, ndvi_diff=-0.24, vegetation_drop_pct=33.3, confidence_score=78),
        weather=WeatherObservation(disaster_date="2026-08-15", rainfall_disaster_day_mm=18.0, rainfall_7day_cumulative_mm=42.0, historical_avg_aug_mm=45.0, anomaly_ratio=1.1, soil_saturation_pct=60.0),
        farmer_reported_loss=32000.0,
        estimated_damage_severity="Moderate",
        evidence_confidence_score=79,
        indicative_likelihood_score=75,
        estimated_payout=24000.0,
        current_status="Pending Review"
    )
    claim_1150.ai_agents = execute_all_agents(claim_1150)
    CLAIMS_DB[claim_1150_id] = claim_1150

    # 6. CLAIM 1092: Lakshmi Bai (Cotton, Raichur, Heavy Rain)
    claim_1092_id = "claim-ksn-1092"
    claim_1092 = Claim(
        id=claim_1092_id,
        claim_number="KSN-2026-1092",
        farmer=FarmerProfile(id="farmer-1092", name="Lakshmi Bai", mobile="9740987654", state="Karnataka", district="Raichur", village="Manvi"),
        land=LandParcel(id="land-1092", survey_number="77/2B", land_parcel_id="KA-RCH-1092", digipin=encode_digipin(15.9924, 77.0512), latitude=15.9924, longitude=77.0512, area_acres=3.5, polygon_geojson=generate_default_polygon(15.9924, 77.0512)),
        crop=CropDetails(crop_name="Cotton", variety="Bt-Cotton RCH-2", sowing_date="2026-06-05", growth_stage="Flowering stage", insured_area_acres=3.5, sum_insured=42000.0, application_number="PMFBY-2026-1092"),
        disaster=DisasterDetails(disaster_type="Heavy rainfall", disaster_date="2026-08-19", reported_cause="Cloudburst causing boll shedding", affected_area_acres=2.8, damage_percentage_reported=65.0, description="Torrential rain washed away flower buds and square bolls."),
        satellite=SatelliteObservation(pre_disaster_date="2026-08-12", post_disaster_date="2026-08-21", ndvi_pre_avg=0.75, ndvi_post_avg=0.33, ndvi_diff=-0.42, vegetation_drop_pct=56.0, confidence_score=89),
        weather=WeatherObservation(disaster_date="2026-08-19", rainfall_disaster_day_mm=112.0, rainfall_7day_cumulative_mm=195.0, historical_avg_aug_mm=50.0, anomaly_ratio=3.8, soil_saturation_pct=91.0),
        farmer_reported_loss=28000.0,
        estimated_damage_severity="High",
        evidence_confidence_score=88,
        indicative_likelihood_score=86,
        estimated_payout=26000.0,
        current_status="Payment Scheduled",
        reviewer_id="REV-EMP-409",
        reviewer_name="Ananya Sharma",
        approved_amount=26000.0,
        reviewer_comments="Heavy rain boll-shedding corroborated by IMD station radar. Direct DBT batch scheduled.",
        reviewed_at="2026-08-23T11:15:00"
    )
    claim_1092.ai_agents = execute_all_agents(claim_1092)
    CLAIMS_DB[claim_1092_id] = claim_1092

    # 7. FRAUD DEMONSTRATION CLAIM: Vikram Singh (Fake Claim / Spoofed Documents & Photos)
    claim_9999_id = "claim-ksn-9999"
    claim_9999 = Claim(
        id=claim_9999_id,
        claim_number="KSN-2026-9999",
        farmer=FarmerProfile(
            id="farmer-fake-9999",
            name="Vikram Singh (Fraud Demo)",
            mobile="9900112233",
            state="Karnataka",
            district="Bengaluru Rural",
            village="Hosakote"
        ),
        land=LandParcel(
            id="land-ka-blr-9999",
            survey_number="88/1",
            land_parcel_id="KA-BLR-9999",
            digipin=encode_digipin(13.0722, 77.7981),
            latitude=13.0722,
            longitude=77.7981,
            area_acres=4.0,
            polygon_geojson=generate_default_polygon(13.0722, 77.7981)
        ),
        crop=CropDetails(
            crop_name="Paddy",
            variety="IR-64",
            sowing_date="2026-06-10",
            growth_stage="Vegetative",
            insured_area_acres=4.0,
            sum_insured=40000.0,
            application_number="PMFBY-2026-9999-SUSPECT"
        ),
        disaster=DisasterDetails(
            disaster_type="Flood",
            disaster_date="2026-08-20",
            reported_cause="Farmer declared total catastrophic flood inundation of 3.8 acres",
            affected_area_acres=3.8,
            damage_percentage_reported=95.0,
            description="Claiming complete catastrophic flood inundation and total crop loss across entire parcel."
        ),
        photos=[
            EvidencePhoto(
                id="photo-fake-1",
                photo_url="/static/sample_damaged_crop.jpg",
                photo_type="damaged_crop",
                timestamp="2026-08-20T16:15:00",
                latitude=13.2014, # 14.3 km away from Hosakote parcel!
                longitude=77.6542,
                metadata_verified=False,
                caption="FRAUD ALERT: Camera EXIF GPS is 14.3 km outside registered parcel boundary in urban area. Suspected internet stock photo."
            ),
            EvidencePhoto(
                id="photo-fake-2",
                photo_url="/static/sample_flood_water.jpg",
                photo_type="waterlogging",
                timestamp="2026-08-20T16:22:00",
                latitude=13.1985, # 14.1 km away!
                longitude=77.6510,
                metadata_verified=False,
                caption="FRAUD ALERT: Missing original hardware EXIF headers. Compression artifacts indicate image re-saving."
            )
        ],
        satellite=SatelliteObservation(
            satellite_source="Sentinel-2 MSI (Level-2A)",
            pre_disaster_date="2026-08-14",
            post_disaster_date="2026-08-22",
            ndvi_pre_avg=0.78,
            ndvi_post_avg=0.76, # Vigorous green, NO damage!
            ndvi_diff=-0.02,
            vegetation_drop_pct=2.56,
            flood_water_index_ndwi=-0.38, # Completely dry!
            confidence_score=14,
            is_simulated=True,
            limitations="CONTRADICTION: Satellite confirms lush, healthy, completely dry canopy with zero water inundation."
        ),
        weather=WeatherObservation(
            source="Open-Meteo & IMD Gridded Reanalysis",
            disaster_date="2026-08-20",
            rainfall_disaster_day_mm=1.2, # Zero rain!
            rainfall_7day_cumulative_mm=3.5,
            historical_avg_aug_mm=48.0,
            anomaly_ratio=0.08,
            soil_saturation_pct=18.0 # Dry soil!
        ),
        farmer_reported_loss=38000.0,
        estimated_damage_severity="Fraud Flagged",
        evidence_confidence_score=12,
        indicative_likelihood_score=6,
        estimated_payout=0.0,
        current_status="Flagged Fraud",
        reviewer_id="REV-EMP-409",
        reviewer_name="Ananya Sharma",
        reviewer_comments="CRITICAL FRAUD: Multi-Agent AI Swarm detected multiple contradictions: (1) Photo GPS is 14.3 km away from parcel. (2) Sentinel-2 satellite proves healthy green canopy (NDVI 0.76). (3) IMD recorded only 1.2 mm rain. Claim rejected and escalated to Vigilance Cell.",
        reviewed_at="2026-08-23T15:45:00"
    )
    claim_9999.ai_agents = execute_all_agents(claim_9999)
    CLAIMS_DB[claim_9999_id] = claim_9999

    # Notifications initial seed
    NOTIFICATIONS_DB = [
        Notification(
            id="notif-1",
            farmer_id="farmer-ksn-1025",
            claim_id=claim_1025_id,
            title="Claim Submitted Successfully",
            message="Your crop damage claim KSN-2026-1025 for Ragi was received. AI Sentinel Twin processing complete.",
            type="info",
            timestamp="2026-08-21T09:42:00"
        ),
        Notification(
            id="notif-2",
            farmer_id="farmer-1088",
            claim_id=claim_1088_id,
            title="Claim Approved by Insurance Reviewer",
            message="Your claim KSN-2026-1088 has been approved for ₹51,000.00 by Ananya Sharma (Lead Reviewer).",
            type="approval",
            timestamp="2026-08-22T14:31:00"
        ),
        Notification(
            id="notif-3",
            farmer_id="farmer-1092",
            claim_id=claim_1092_id,
            title="DBT Payment Scheduled",
            message="Settlement payout of ₹26,000.00 scheduled for bank transfer via PMFBY portal.",
            type="payment",
            timestamp="2026-08-23T11:16:00"
        )
    ]

# Initialize seed on module import
init_seed_data()

def get_all_claims() -> List[Claim]:
    return list(CLAIMS_DB.values())

def get_claim_by_id(claim_id: str) -> Optional[Claim]:
    return CLAIMS_DB.get(claim_id)

def get_claim_by_number(claim_num: str) -> Optional[Claim]:
    for c in CLAIMS_DB.values():
        if c.claim_number.upper() == claim_num.upper():
            return c
    return None

def save_claim(claim: Claim) -> Claim:
    claim.updated_at = datetime.now().isoformat()
    CLAIMS_DB[claim.id] = claim
    return claim

def add_notification(notif: Notification):
    NOTIFICATIONS_DB.insert(0, notif)

def get_farmer_notifications(farmer_id: str) -> List[Notification]:
    return [n for n in NOTIFICATIONS_DB if n.farmer_id == farmer_id or farmer_id == "all"]
