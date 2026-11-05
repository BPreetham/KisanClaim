export interface UserSession {
  role: 'farmer' | 'insurance';
  token: string;
  user: {
    id?: string;
    name: string;
    mobile?: string;
    state?: string;
    district?: string;
    village?: string;
    company_id?: string;
    reviewer_id?: string;
    company_name?: string;
    title?: string;
    department?: string;
  };
}

export interface FarmerProfile {
  id: string;
  name: string;
  mobile: string;
  state: string;
  district: string;
  village: string;
  created_at?: string;
}

export interface LandParcel {
  id: string;
  survey_number: string;
  land_parcel_id: string;
  digipin: string;
  latitude: number;
  longitude: number;
  area_acres: number;
  polygon_geojson?: number[][];
}

export interface CropDetails {
  crop_name: string;
  variety?: string;
  sowing_date: string;
  expected_harvest?: string;
  growth_stage: string;
  insured_area_acres: number;
  insurance_scheme: string;
  application_number: string;
  sum_insured: number;
}

export interface DisasterDetails {
  disaster_type: string;
  disaster_date: string;
  disaster_time?: string;
  reported_cause: string;
  affected_area_acres: number;
  damage_percentage_reported: number;
  description: string;
}

export interface EvidencePhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  metadata_verified: boolean;
  caption?: string;
}

export interface SatelliteObservation {
  satellite_source: string;
  pre_disaster_date: string;
  post_disaster_date: string;
  ndvi_pre_avg: number;
  ndvi_post_avg: number;
  ndvi_diff: number;
  vegetation_drop_pct: number;
  flood_water_index_ndwi?: number;
  confidence_score: number;
  is_simulated?: boolean;
  limitations?: string;
}

export interface WeatherObservation {
  source: string;
  disaster_date: string;
  rainfall_disaster_day_mm: number;
  rainfall_7day_cumulative_mm: number;
  historical_avg_aug_mm: number;
  anomaly_ratio: number;
  soil_saturation_pct: number;
  confidence_score: number;
  timeline?: { date: string; rainfall_mm: number; is_disaster_day?: boolean }[];
}

export interface AIAgentFinding {
  agent_id: string;
  agent_name: string;
  agent_role: string;
  status: 'passed' | 'flagged' | 'needs_review' | string;
  score: number;
  risk_level: 'low' | 'medium' | 'high' | string;
  summary: string;
  findings: string[];
  supporting_evidence: string[];
  contradicting_evidence: string[];
  explanation: string;
  recommended_action: string;
}

export interface Claim {
  id: string;
  claim_number: string;
  farmer: FarmerProfile;
  land: LandParcel;
  crop: CropDetails;
  disaster: DisasterDetails;
  photos: EvidencePhoto[];
  satellite: SatelliteObservation;
  weather: WeatherObservation;
  ai_agents: AIAgentFinding[];
  farmer_reported_loss: number;
  estimated_damage_severity: 'Low' | 'Moderate' | 'High' | 'Severe' | string;
  evidence_confidence_score: number;
  indicative_likelihood_score: number;
  estimated_payout: number;
  payout_calculation_notes?: string;
  current_status: 'Submitted' | 'AI Processing' | 'Pending Review' | 'Additional Evidence Required' | 'Approved' | 'Rejected' | 'Payment Scheduled' | 'Paid' | string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_comments?: string;
  approved_amount?: number;
  rejection_reason?: string;
  requested_evidence_notes?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  farmer_id: string;
  claim_id: string;
  title: string;
  message: string;
  type: 'approval' | 'rejection' | 'evidence_request' | 'payment' | 'info' | string;
  read: boolean;
  timestamp: string;
}

export interface StatsKPI {
  total_claims: number;
  pending_verification: number;
  approved_claims: number;
  rejected_claims: number;
  additional_evidence_required: number;
  high_severity_claims: number;
  ai_flagged_claims: number;
  total_estimated_claim_value: number;
  average_processing_time_hours: number;
}
