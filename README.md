# 🌍 EarthGuard AI — Satellite Change Detection & Prioritized Response System

> **Theme**: AI for Space & Earth Intelligence  
> **Mission**: Autonomous Planetary Triage — Transforming raw before/after satellite imagery into severity-ranked, confidence-calibrated operational incident briefs for frontline field responders.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![OpenCV](https://img.shields.io/badge/Computer%20Vision-OpenCV%205.0-5C3EE8.svg?style=flat&logo=opencv)](https://opencv.org/)
[![Leaflet](https://img.shields.io/badge/Geospatial-Leaflet%20JS-199900.svg?style=flat&logo=leaflet)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 The Core Problem & Differentiator

Vast orbital constellations (Sentinel-2, Landsat-9, PlanetScope) deliver continuous observations of our planet, but **manual change detection is slow, noisy, and unranked**. 

Most competing solutions generate a flat, unranked difference heatmap: thousands of red pixels with no context. Field teams cannot tell whether a red blob represents a catastrophic flash flood tearing through a town or natural seasonal grass browning 50 km away.

**EarthGuard AI solves this with 3 core novelties:**
1. **Severity-Ranked Prioritization**: An explainable multi-factor Urgency Score ($0-100$) triaging detected zones into **Critical**, **Moderate**, and **Low** based on spectral delta, contiguous hectare size, and human settlement/infrastructure proximity.
2. **Confidence-Aware Transparency**: Surfacing sensor noise, specular glare, and cloud obstruction heuristics as explicit confidence ratings (*High Confidence*, *Moderate Confidence*, *Needs Field Verification*).
3. **Natural-Language Operational Briefs**: Synthesizing 2-3 sentence decision-ready briefs with explicit recommended protocols, dispatch windows, and audio read-aloud capabilities.

---

## 🚀 Key Features & Capabilities

- ⚡ **Near-Real-Time CV Differencing**: Classical computer vision with Otsu adaptive thresholding and morphological consolidation (<150ms processing).
- 🌿 **Multispectral Index Math**: Computes vegetation delta (NDVI proxy) and water inundation delta (NDWI proxy).
- 🎚️ **Interactive Split Curtain Slider**: Seamlessly wipe between Before baseline and After observation directly over the satellite canvas.
- 🗺️ **Geospatial Satellite Map**: Integrated Leaflet engine with real ESRI World Imagery satellite tiles, GPS coordinate telemetry, and vector polygons.
- 🔊 **Voice Synthesis Operational Briefings**: One-click audio read-aloud of AI incident briefs.
- 📄 **Executive Incident Docket Export**: One-click generation of printable crisis briefings for emergency agencies (Civil Defense, FEMA, Red Cross).
- 📁 **Custom Imagery Ingestion**: Drag-and-drop support for any user-uploaded Before/After satellite pair.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │                 EarthGuard AI Platform                 │
                               └────────────────────────────────────────────────────────┘
                                                           │
                    ┌──────────────────────────────────────┴──────────────────────────────────────┐
                    ▼                                                                            ▼
┌────────────────────────────────────────┐                                   ┌────────────────────────────────────────┐
│            FastAPI Backend             │                                   │       Aerospace Mission Control        │
│          (Port 8000 / localhost)       │                                   │          (Modern Dark HUD UI)          │
├────────────────────────────────────────┤                                   ├────────────────────────────────────────┤
│ • cv_engine.py: Spectral Diff & Contours│        JSON Payload & Overlays   │ • index.html: Semantic Command Layout  │
│ • prioritization.py: Urgency Formula   │ ◄───────────────────────────────► │ • style.css: Glassmorphism Design      │
│ • confidence.py: Cloud & Noise Scoring │                                   │ • app.js: Interactive Canvas & Leaflet │
│ • classifier.py: Event Type Classifier │                                   │ • Audio Briefings (Speech Synthesis)   │
│ • briefing_engine.py: Decision Briefs  │                                   │ • Executive Crisis Docket Modal        │
└────────────────────────────────────────┘                                   └────────────────────────────────────────┘
```

---

## ⚡ Quickstart & Local Installation

### Prerequisites
- Python 3.10+ (Python 3.13 supported)
- Modern web browser (Chrome, Edge, Firefox, Brave)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/dravid0804/sriramHackathon.git
cd sriramHackathon

# Install requirements
pip install -r requirements.txt
```

### 2. Verify Pipeline Tests
```bash
python -m backend.test_pipeline
```

### 3. Launch Mission Control Dashboard
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Open your browser to: **`http://127.0.0.1:8000`**

---

## 📂 Pre-Packaged Demo Datasets

1. **Amazon Rainforest Deforestation (Rondônia, Brazil)**:
   - High-magnitude clear-cutting encroaching on the Nova Esperança indigenous community buffer.
2. **Derna Coastal Flash Flooding (Libya)**:
   - Catastrophic dam breach and flash flood swath washing through dense residential infrastructure.
3. **California Wildfire Burn Scar (Butte County, USA)**:
   - Charred timber burn scar threatening the wildland-urban interface (WUI).

---

## 👥 Hackathon Team Documentation

- 📋 **[Team Worksplit & Architecture Guide](docs/TEAM_WORKSPLIT.md)**: 3-member role allocation and zero-merge-conflict branch workflow.
- ⏱️ **[2-Minute Winning Pitch Script](docs/PITCH_SCRIPT.md)**: Timed presentation script with live UI click cues.

---

## 📜 License
Distributed under the MIT License. Built for the **AI for Space & Earth Intelligence Hackathon**.
