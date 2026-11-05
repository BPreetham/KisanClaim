# 🌾 KisanClaim — AI-Powered Crop Damage Evidence Intelligence & Autonomous PMFBY Insurance Claim Verification Platform

> **Hackathon Prototype & Production Blueprint**  
> An autonomous crop insurance verification platform that fuses **Copernicus Sentinel-2 MSI multispectral satellite imagery**, **Open-Meteo & IMD meteorological reanalysis**, **Department of Posts DIGIPIN 4m × 4m geodetic geocoding**, **interactive satellite cadastral plot boundary marking**, **in-app geotag-stamped camera evidence capture**, and an **Autonomous Multi-Agent AI verification swarm**.

---

## 🌟 Key Innovations & Core Modules

### 1. 🛰️ Geospatial Digital Twin & Satellite Remote Sensing
* **Before-and-After Sentinel-2 Imagery Slider**: Interactive split-view comparison between pre-disaster (2026-08-14) and post-disaster (2026-08-22) optical and false-color reflectance imagery.
* **Spectral Vegetation Degradation (NDVI)**: Real-time calculation of Normalized Difference Vegetation Index drop from **0.74** (healthy vegetative canopy) to **0.28** (-62.16% vegetation loss), color-coded with spectral heatmaps.
* **Surface Water Inundation (NDWI)**: Normalized Difference Water Index detection (+0.48) accurately delineating submerged basin zones and flood footprints.
* **Cadastral Boundary Mapping**: Interactive vector boundary projection displaying perimeter lengths, corner vertices (`P1`–`P4`), and parcel acreage via the Shoelace formula.

### 2. 🗺️ Satellite Plot Selection & DIGIPIN 4m × 4m Grid Lock
* **Interactive Leaflet Satellite Mapping**: High-resolution Esri World Imagery & Google Hybrid tiles allow farmers to pinpoint and adjust their parcel boundary with draggable corner pins (`P1` to `P4`).
* **Live Boundary Edge Metrics**: Computes exact edge distances in meters between corners and total parcel perimeter in real time.
* **India DIGIPIN Integration**: Direct geocoding to the Government of India Department of Posts 10-character alphanumeric 4m × 4m National Postal Grid cell (e.g. `562C-8F29-KM`), corroborating Bhoomi survey numbers.

### 3. 📸 In-App Live GeoCamera with Burned Cadastral Geotags
* **Direct Hardware Camera Viewfinder**: Accesses the user's mobile or laptop webcam with real-time video stream, facing-mode switcher, and flash HUD.
* **Permanent Canvas Geotag HUD Stamping**: Automatically stamps:
  * Cadastral GPS Coordinates (Latitude, Longitude to 5 decimal places with lock accuracy)
  * National DIGIPIN code & Bhoomi Survey Number
  * State, District, and Village metadata
  * High-precision ISO timestamp with microsecond resolution
  * Official KisanClaim Cadastral Verification Stamp (`✓ IN-PARCEL EXIF VERIFIED`)
* **Tamper-Evident Evidence**: Encoded as high-resolution JPEG Data URLs, preventing external photo manipulation and geofence fraud.

### 4. 🎙️ Bilingual AI Voice Assistant for Farmers
* **Guided 6-Stage Natural Language Flow**:
  1. Farmer Identity & Contact
  2. Land Parcel & Interactive Satellite Boundary Marking
  3. Crop Phenology & Sowing Dates
  4. Disaster Type & Inception Timeline
  5. Financial Loss Declaration
  6. Live Geocamera Photo Capture
* **Voice Synthesis & Recognition**: Full Web Speech API integration with natural voice readout, ambient chime feedback, and speech-to-text dictation.
* **Bilingual Switch**: Instant seamless toggling between **English** and **Kannada (ಕನ್ನಡ)**.

### 5. 🤖 Autonomous Multi-Agent AI Verification Swarm
1. **Agent 1 — Fraud & Geofence Interception Agent**: Evaluates image metadata, perceptual hashes, and geofence deviations (>400m triggers automated fraud flags).
2. **Agent 2 — Cadastral Document Verification Agent**: Cross-verifies state land records (Bhoomi), survey numbers, and PMFBY policy registrations.
3. **Agent 3 — Satellite & Weather Corroboration Agent**: Cross-corroborates Sentinel-2 vegetation collapse with Open-Meteo ERA5 precipitation spikes.
4. **Agent 4 — Actuarial Loss & Scale of Finance Agent**: Computes transparent indicative payouts based on official PMFBY district Scale of Finance benchmarks (₹10,000/acre).
5. **Agent 5 — Indicative Likelihood Score Agent**: Calculates overall claim credibility (0–100%) broken down into positive and negative actuarial drivers.
6. **Agent 6 — AI Reviewer Copilot**: Grounded conversational assistant enabling insurance underwriters to query evidence, ask actuarial questions, and inspect discrepancies without hallucinations.
* **On-Demand Single-Agent Triggers**: Insurance reviewers can trigger individual agents on-demand with live progress states and score recalibration.

### 6. 📊 Explainable AI (XAI) Causal Evidence Graph
* **Interactive Visual Provenance**: Direct causal link visualization connecting:
  `Farmer Declaration → Insured Policy → Cadastral Plot → Sentinel-2 Telemetry → NDVI Delta → Weather Radar → Geotagged Photos → AI Swarm Scores → Human Adjudication`
* High-contrast styling with color-coded confidence indicators and expandable evidence nodes.

### 7. 📑 Multi-Page Verification Dossier & PDF Export
* **8 Structured Intelligence Sections**:
  1. Executive Summary & Policy Cross-Reference
  2. Farmer Identity & Cadastral Verification
  3. Marked Cadastral Land Plot Boundary & DIGIPIN Square Match
  4. Open-Meteo & IMD Meteorological Rainfall Corroboration
  5. Geo-Tagged Ground Photographic Evidence
  6. Autonomous AI Multi-Agent Verification Findings
  7. Indicative Loss Estimation & Actuarial Summary
  8. Verification Governance, Adjudication & Digital QR Token
* **Dual-Axis Hydro-Meteorological Graph**: Dual-axis SVG visualization combining daily precipitation bars (mm) with smooth Catmull-Rom cubic Bézier topsoil moisture saturation curves (%), weather icons, and flash runoff threshold markers.
* **Official Scannable QR Code**: ISO/IEC 18004 compliant QR token generated via OpenCV encoding the official dossier verification link.
* **Export Options**: In-browser print-to-PDF layout and native downloadable PDF stream.

---

## 🏗️ Technical Architecture & Stack

```
                          ┌───────────────────────────┐
                          │   Farmer & Insurer UI     │
                          │ React 19 + Vite 8 + TS    │
                          │ Tailwind CSS + Leaflet    │
                          └─────────────┬─────────────┘
                                        │ REST / WebSockets
                                        ▼
                          ┌───────────────────────────┐
                          │     FastAPI Backend       │
                          │ Python 3.12 + Uvicorn     │
                          └─────────────┬─────────────┘
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
    ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
    │  Geospatial Engine   │ │  Meteorology Engine  │ │  Multi-Agent Swarm   │
    │  Sentinel-2 (L2A)    │ │  Open-Meteo ERA5     │ │  Fraud Interceptor   │
    │  NDVI / NDWI / GIS   │ │  IMD Gridded Radar   │ │  Document Verifier   │
    │  Shoelace / DIGIPIN  │ │  Soil Saturation     │ │  Satellite/Weather   │
    │  OpenCV QR Generator │ │  Runoff Anomaly      │ │  Actuarial Assessor  │
    └──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

* **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS, Leaflet, Lucide Icons, Canvas Confetti.
* **Backend**: Python 3.12, FastAPI, Uvicorn, WebSockets, OpenCV (`cv2.QRCodeEncoder`), Pillow (PIL), NumPy.
* **Data Sources**: Copernicus Sentinel-2 MSI level-2A, Open-Meteo Historical Archive API, India Postal DIGIPIN.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v18 or higher) and **npm**
* **Python** (v3.10 or higher) with pip

---

### Method A: One-Click Launch (Windows)
Double-click `start_both.bat` located in the project root:
```cmd
start_both.bat
```
This opens two terminal windows:
1. **Backend Server** on `http://127.0.0.1:8000`
2. **Frontend Dev Server** on `http://127.0.0.1:5173`

---

### Method B: Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
# Navigate to project root
cd kisanclaim

# Install python dependencies
pip install fastapi uvicorn pillow opencv-python numpy pydantic

# Run the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
API Documentation will be live at: **`http://127.0.0.1:8000/docs`**

#### 2. Frontend Setup
```bash
# Open a new terminal in frontend directory
cd kisanclaim/frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser at: **`http://127.0.0.1:5173`**

---

## 📋 Comprehensive Hackathon Demo Walkthrough

### Act I: The Farmer's Experience
1. **Login**: Enter demo mobile number `9876543210` (Ravi Kumar) or register a new farmer.
2. **AI Voice Assistant**: Click **"I Need Voice Assistance 🎙️"**.
   - Listen to the audio prompts in English or toggle to Kannada.
   - Watch the interactive satellite map center on Devanahalli (`13.2456°N, 77.7123°E`).
   - Move corners `P1`–`P4` to fit the farm parcel; see the area update dynamically.
   - Click **"Take Real-Time Geotagged Photo"** to open the in-app camera, snap a photo, and observe the burned cadastral banner.
3. **Submission**: Submit the claim and watch the 11-stage autonomous telemetry fusion engine process Sentinel-2, radar, and ground photos in real time.
4. **Geospatial Twin**: Slide the before-and-after satellite overlay to see vegetative canopy collapse and flood boundaries.
5. **Dossier Report**: Click **"View & Print Claim Report"** to inspect:
   - Cadastral vector plot and DIGIPIN matching reticle.
   - Hydro-meteorological dual-axis rainfall & soil moisture graph.
   - Real-time camera evidence with burnt geotag badges.
   - Scannable digital QR token.

### Act II: The Insurance Underwriter's Inspection
1. Switch to **"Insurance Console 🏢"** from the navigation bar.
2. Select claim **KSN-2026-1025** (or your newly submitted claim).
3. **On-Demand Agents**: Click individual **"Check Score"** buttons on each verification agent to execute real-time AI scoring.
4. **Explainable AI**: Explore the interactive evidence graph tracing the full chain of causality.
5. **AI Copilot**: Ask questions in the underwriting chat (e.g. *"Why is this claim approved?"* or *"What does the satellite NDVI drop indicate?"*).
6. **Adjudication**: Click **"Adjudicate / Review Decision"** → Select **Approve** (₹17,500) and submit with confetti celebration.
7. Switch back to the Farmer view to witness the real-time status update!

---

## 📂 Project Directory Structure

```
kisanclaim/
├── backend/
│   ├── main.py              # FastAPI REST endpoints & WebSocket server
│   ├── models.py            # Pydantic schemas (Claim, LandParcel, Weather, Agents)
│   ├── database.py          # In-memory storage & seed claims (including fraud edge cases)
│   ├── geospatial.py        # Haversine distance, Shoelace area, DIGIPIN encoder
│   ├── pdf_generator.py     # Multi-section HTML & PDF dossier generator + QR engine
│   └── static/              # Sample high-res Sentinel-2 & ground evidence photographs
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # 2-Step Registration & Login Wizard
│   │   │   ├── common/      # Navbar, ReportViewerModal, Notifications
│   │   │   ├── farmer/      # FarmerDashboard, VoiceAssistant, GeoCameraModal,
│   │   │   │                # LandPlotMapSelector, GeospatialTwinViewer, SubmissionModal
│   │   │   └── insurance/   # ClaimQueueTable, ClaimDetailPage, ReviewerCopilot,
│   │   │                    # ExplainableAIGraph, AdjudicationModal
│   │   ├── utils/           # geo.ts (Haversine/DIGIPIN), speech.ts (Web Speech & audio)
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── App.tsx          # Main application router & role switcher
│   │   └── main.tsx         # Vite React entry point
│   ├── index.html           # HTML template
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite configuration with proxy to FastAPI backend
├── run_backend.bat          # Dedicated backend launcher
├── run_frontend.bat         # Dedicated frontend launcher
├── start_both.bat           # Dual-service concurrent launcher
└── README.md                # Project documentation
```

---

## 🔒 Security & Anti-Fraud Architecture
* **Geofence Enforcement**: Rejects evidence photos captured outside a 400-meter buffer from the cadastral parcel centroid.
* **Spectral Cross-Corroboration**: Disproves false flood claims when Sentinel-2 NDVI remains healthy (>0.70) or NDWI confirms dry ground.
* **Meteorological Radar Corroboration**: Flags claims where declared disaster dates do not align with IMD/Open-Meteo recorded precipitation events.
* **Cryptographic Verification QR**: Every generated dossier embeds a unique QR token linking directly to the immutable verification twin.

---

## 📜 License & Acknowledgements
* Developed for Hackathon demonstration.
* Built on open datasets and standards: **Copernicus Sentinel-2**, **Open-Meteo API**, **Government of India DIGIPIN Geocoding Standard**, and **PMFBY Guidelines**.
