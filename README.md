# KisanClaim — AI-Powered Crop Damage Evidence Intelligence & Insurance Claim Verification Platform

> **Hackathon Prototype Build** — Designed for live demonstrations to hackathon judges.
> Combines Copernicus Sentinel-2 multispectral satellite imagery, Open-Meteo meteorological reanalysis, Department of Posts DIGIPIN geocoding, and an autonomous Multi-Agent AI verification swarm.

---

## 🌟 Key Features & Novelty

### 1. 🛰️ Geospatial Evidence Twin
- **Interactive Before-and-After Slider**: Compares Sentinel-2 Level-2A imagery acquired on 2026-08-14 (Pre-disaster) and 2026-08-22 (Post-disaster).
- **NDVI Vegetation Degradation**: Visualizes the collapse in Normalized Difference Vegetation Index from **0.74** (healthy canopy) down to **0.28** (-62.16% vegetation drop) with green-to-yellow-to-red spectral heatmaps.
- **NDWI Water Index**: Identifies flood water inundation (+0.48 index) covering 1.8 acres of the registered 2.5-acre parcel.
- **DIGIPIN Integration**: Implements India's national 10-character alphanumeric geodetic grid code (e.g., `562C-8F29-KM`).
- **Geo-Tagged Ground Evidence**: Overlays farmer photographs with EXIF camera coordinates and timestamp verification tags.

### 2. 🎙️ AI Voice Assistant for Farmers
- **Step-by-Step Guided Q&A**: 6 structured stages (Farmer Identification, Land & GPS Map, Crop Phenology, Disaster Occurrence, Financial Loss, Photo Evidence).
- **Web Speech API Narration & Dictation**: Speaks questions aloud and supports voice transcriptions with text fallback.
- **Bilingual Interface**: Seamlessly toggles between **English** and **Kannada (ಕನ್ನಡ)**.
- **Skip / I Don't Know**: Every question provides non-intrusive skips to avoid blocking farmers.

### 3. 🤖 Multi-Agent AI Insurance Verification Swarm
- **Agent 1 — Fraud Detection Agent**: Evaluates image metadata, perceptual hashes, and geofencing offsets (<400m from registered boundary).
- **Agent 2 — Document Verification Agent**: Cross-checks Bhoomi survey numbers (125/2) and PMFBY policy numbers (`PMFBY-2026-1025`).
- **Agent 3 — Satellite & Weather Agent**: Corroborates Open-Meteo 142.5 mm cloudburst rainfall with Sentinel-2 NDVI collapse.
- **Agent 4 — Claim Assessment Agent**: Computes transparent indicative payout benchmarks based on PMFBY scale of finance (₹10,000/acre).
- **Agent 5 — Claim Assessment Likelihood Agent**: Computes an 88% indicative likelihood index with positive and negative drivers.
- **Agent 6 — AI Reviewer Copilot**: Grounded chat assistant answering reviewer inquiries in real time without hallucinations.

### 4. 🌐 Explainable AI Evidence Graph
Interactive causal graph connecting:
`Farmer Claim → Insured Crop → Disaster Event → Cadastral Parcel → Sentinel-2 Telemetry → NDVI Shift → Open-Meteo Radar → Geotagged Photos → AI Multi-Agent Score → Human Adjudication`

### 5. 📑 Multi-Page Dossier & Downloadable PDF Report
- 8 structured sections: Executive Summary, Farmer/Land Identification, Satellite NDVI Twin, Meteorological Timeline, Ground Photo Gallery, AI Agent Scorecards, Actuarial Loss Breakdown, and Legal Disclaimer with QR code verification.
- Instant print-to-PDF and native binary PDF download.

### 6. ⚡ Live Cross-Dashboard WebSocket Notifications
- When an insurance reviewer approves a claim, rejects it, or requests additional evidence, the farmer's dashboard updates in real time with audio-visual alerts.

---

## 🚀 Live Demo Sequence for Hackathon Judges

1. **Scene 1 — Farmer Login & Greeting**: Open `http://127.0.0.1:5173`. Welcome banner displays: *"Welcome, Ravi. Let's protect your crop."*
2. **Scene 2 — AI Voice Assistant**: Click **"I Need Voice Assistance"**. Animated robot assistant asks questions with voice narration.
3. **Scene 3 — Auto-Location & DIGIPIN**: System captures GPS coordinates (`13.2456°N, 77.7123°E`) and generates DIGIPIN `562C-8F29-KM`.
4. **Scene 4 — 11-Stage Animated Analysis**: Upon submitting, watch the 11-stage autonomous telemetry fusion engine process Sentinel-2, radar, and ground photos.
5. **Scene 5 — Geospatial Evidence Twin**: Inspect the before-and-after slider comparing pre-disaster lush ragi against post-disaster flood inundation.
6. **Scene 6 — Dossier Report**: Click **"View & Print Claim Report"** to view the multi-page insurance dossier with QR code.
7. **Scene 7 — Insurance Console Switch**: Click **"Insurance Console 🏢"** in the top navigation bar.
8. **Scene 8 — Reviewer Inspection**: Open **Ravi Kumar (KSN-2026-1025)** from the claim queue table.
9. **Scene 9 — AI Copilot Inquiry**: Ask the Copilot: *"Why is this claim considered high priority?"*
10. **Scene 10 — Human Approval**: Click **"Adjudicate / Review Decision"** → Select **Approve (₹17,500)** → Commit decision with celebration confetti.
11. **Scene 11 — Instant Farmer Update**: Switch back to **"Farmer Dashboard 🌾"** to observe real-time approval status and reviewer audit notes!

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend**: Python 3.12, FastAPI, Uvicorn, WebSockets, Pillow (PIL), Urllib standard library.
- **Geospatial & Remote Sensing**: Copernicus Sentinel-2 MSI level-2A, Normalized Difference Vegetation Index (NDVI), Normalized Difference Water Index (NDWI), India DIGIPIN 4x4 geocoding.
- **Meteorology**: Open-Meteo Historical Archive API (ERA5 Reanalysis) & IMD Gridded Data.

---

## 🏃 Running the Application

### Backend:
```powershell
cd C:\Users\ASUS\.gemini\antigravity\scratch\kisanclaim
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Frontend:
```powershell
cd C:\Users\ASUS\.gemini\antigravity\scratch\kisanclaim\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open **`http://127.0.0.1:5173`** in your browser.
