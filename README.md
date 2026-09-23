# 🛰️ EarthLens AI — AI for Space & Earth Intelligence

> **Autonomous Satellite Change Detection & Community Impact Intelligence Platform**  
> *Transforming raw multi-temporal satellite imagery into transparent change classification, infrastructure proximity analysis, and actionable community protection briefs.*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![OpenCV](https://img.shields.io/badge/Computer%20Vision-OpenCV%205.0-5C3EE8.svg?style=flat&logo=opencv)](https://opencv.org/)
[![Leaflet](https://img.shields.io/badge/Geospatial-Leaflet%20JS-199900.svg?style=flat&logo=leaflet)](https://leafletjs.com/)
[![ESRI](https://img.shields.io/badge/Imagery-ESRI%20World%20Satellite-007ac2.svg?style=flat)](https://www.esri.com/)
[![Chart.js](https://img.shields.io/badge/Analytics-Chart.js-FF6384.svg?style=flat)](https://www.chartjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview & Vision

**EarthLens AI** is an AI-powered satellite change detection and community impact intelligence platform. Rather than a generic administrative dashboard with a small embedded map, EarthLens AI is built as a **Map-First Planetary Intelligence Suite** where the interactive satellite map serves as the primary canvas.

It answers the core mission question:  
**"Who and what could be affected by this environmental change?"**

By fusing multi-temporal satellite imagery (Sentinel-2, Sentinel-1 SAR, Landsat-9) with cadastral infrastructure datasets (OpenStreetMap, Humanitarian Data Exchange), EarthLens AI detects significant geographical shifts, quantifies their magnitude, classifies hazard types, and models potential exposure on nearby communities, schools, hospitals, transit links, and agricultural reserves.

---

## 🎨 Visual System & Strict Semantic Color Language

The platform adopts a modern **dark geospatial intelligence / aerospace command** aesthetic (`#070a12`, `#090e1a`, glassmorphism panels with 1px luminous borders). Colors are used strictly to communicate meaning:

| Semantic Color | Hex Code | Meaning / Intelligence Classification |
| :--- | :--- | :--- |
| 🟢 **Green** | `#10b981` | **Stable** — Verified perimeter, zero significant change, agricultural baseline. |
| 🟡 **Yellow** | `#eab308` | **Minor / Moderate Change** — Routine observation, low-velocity shift. |
| 🟠 **Orange** | `#f97316` | **Warning** — Rapid rate of change, transit and corridor compromise. |
| 🔴 **Red** | `#ef4444` | **Critical / Emergency** — High-priority hazard, active flooding or wildfire burn. |
| 🔵 **Blue** | `#06b6d4` | **Water / Flood** — Reservoir breaches, riverine overflow, coastal surges. |
| 🟣 **Purple** | `#a855f7` | **Community Impact** — Settlements, schools, hospitals, vulnerable demographic buffers. |
| ⚪ **White / Gray** | `#f8fafc` | **Neutral Info** — Coordinates, dates, telemetry indexes. |

---

## 🗺️ Extraordinary Live Intelligence Map

The centerpiece of EarthLens AI is an interactive geospatial map providing:

- **Dual High-Resolution Basemaps**: Seamlessly switch between **ESRI World Imagery** satellite ortho-mosaics and **CartoDB Dark Matter** tactical terrain.
- **Top Comparison Modes**:
  - `[ BEFORE ]`: Displays baseline pre-event satellite observation.
  - `[ AFTER ]`: Displays current post-event satellite observation.
  - `[ DIFFERENCE ]`: Visualizes OpenCV spectral difference heatmaps with contour polygons.
  - `[ IMPACT ]`: Overlays community perimeters, schools 🏫, hospitals 🏥, transit corridors 🛣️, and demographic vulnerability heatmaps.
- **Draggable Swipe Curtain Slider**: Interactive divider handle allowing users to slide left/right and visually compare before/after satellite rasters directly on the map.
- **Dedicated 16-Layer Control Drawer**:
  1. ☑ Detected Changes
  2. ☑ Change Severity
  3. ☑ Investigation Priority Zones
  4. ☑ Flood Areas
  5. ☑ Deforestation
  6. ☑ Fire Damage
  7. ☑ Urban Expansion
  8. ☑ Coastal Changes
  9. ☑ Water Bodies
  10. ☑ Agricultural Areas
  11. ☑ Roads & Bridges
  12. ☑ Buildings
  13. ☑ Schools
  14. ☑ Hospitals
  15. ☑ Settlements
  16. ☑ Community Vulnerability Heatmap
- **Floating HUD Controls**:
  - Top-Left: Real-time GPS coordinate telemetry and active AOI pill.
  - Top-Right: 16-Layer manager drawer toggle, basemap switcher, AI Copilot toggle.
  - Bottom-Left: Collapsible floating semantic color legend.
  - Bottom-Right: Zoom in/out, AOI recenter, distance measurement tool, fullscreen toggle.

---

## 🚀 Key Modules & Capabilities

### 1. 🌐 Overview Dashboard
- Executive KPI Cards: *Changes Detected*, *High Priority Changes*, *Total Affected Area*, *Communities Potentially Affected*, *Critical Infrastructure at Risk*.
- Priority Changes Table with instant zoom-to-anomaly capability.

### 2. 🔍 Satellite Change Detection Workspace
- Visual side-by-side Before/After inspection with sensor dates.
- Anomaly inventory table: Location, Change Type, Area (km²), Severity, Confidence, and Priority.

### 3. 👥 Community Impact Intelligence & Vulnerability Layer
- Answers: *"Who and what could be affected by this environmental change?"*
- Analyzes proximity to settlements, schools, hospitals, transit bridges, and agricultural reserves.
- **Community Vulnerability Model**: Identifies High, Moderate, and Low vulnerability zones.
- **Scientific Labeling Rigor**: All assets are labeled as **"Potentially Affected"** to eliminate speculative claims.

### 4. 📈 Historical Analysis & Hotspots Timeline
- Multi-year surveillance slider (**2024 $\rightarrow$ 2025 $\rightarrow$ 2026**).
- Interactive Chart.js visualizations:
  - *Affected Area Over Time (km²)*
  - *Changes by Category Distribution*
  - *Priority Threats Over Time*
- Geographic Hotspots (Hotspots Alpha, Bravo, Charlie, Delta) with one-click map centering.

### 5. 🚨 Active Alerts Queue
- Prioritized incident alerts (Critical, Moderate, Low).
- Interactive triage actions: **View on Map**, **Investigate**, **Mark as Reviewed**.

### 6. 🤖 Grounded AI Investigation Assistant
- Conversational Copilot grounded strictly in verified dataset telemetry (zero hallucinations).
- Quick prompt pills:
  - *"What changed here?"*
  - *"Which areas require attention?"*
  - *"What happened between these dates?"*
  - *"What communities are near this change?"*
  - *"Show me high-priority changes."*

### 7. 📄 Executive Reports Dossier
- Instant generation of official investigation dossiers with mission title, satellite thumbnail, AI narrative, and infrastructure audit.
- One-click print / PDF export formatted for emergency response leadership.

### 8. 🛰️ Data Sources Catalog
- Verifies satellite constellations: Copernicus Sentinel-2 MSI, Sentinel-1 SAR, USGS/NASA Landsat 8/9, NASA FIRMS, OpenStreetMap HDX, ESRI World Imagery.

---

## 🌍 Demo Mode (3 Core Scenarios + Wildfire)

EarthLens AI ships with 4 high-fidelity pre-packaged scenarios:

1. 🌊 **Mediterranean Coastal Basin (Derna, Libya)**: Extreme flash flood inundation and dam overtopping; 14.2 km² affected, 6 settlements, 3 schools, 1 hospital with severed bridge access.
2. 🌳 **Amazon Rainforest (Rondônia, Brazil)**: Fishbone commercial logging incursions; 8.1 km² affected, encroaching within 1.1 km of indigenous reserve community buffer.
3. 🏙️ **Madurai Region (Tamil Nadu, India)**: Accelerated peri-urban expansion; 4.8 km² agricultural wetland conversion, bypass highway expansion, and groundwater catchment reduction.
4. 🔥 **Sierra Nevada Foothills (California, USA)**: High-intensity timber canopy burn scar threatening Wildland-Urban Interface (WUI) residential communities.

---

## ⚡ Quickstart & Local Installation

### Prerequisites
- Python 3.10+
- Modern Web Browser (Chrome, Edge, Firefox, Safari)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/dravid0804/sriramHackathon.git
cd sriramHackathon
pip install -r requirements.txt
```

### 2. Verify Pipeline & Test Suite
```bash
python -m backend.test_pipeline
```

### 3. Launch EarthLens AI Server
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Open your browser at **`http://127.0.0.1:8000`**.

---

## 🏛️ Project Directory Structure

```
SRIRAM_HACKATHON/
├── backend/
│   ├── main.py                     # FastAPI application & REST endpoints
│   ├── cv_engine.py                # Classical CV differencing & Otsu contouring
│   ├── classifier.py               # Multi-hazard environmental change classifier
│   ├── prioritization.py           # Multi-factor transparent urgency formula
│   ├── test_pipeline.py            # Automated end-to-end verification test suite
│   └── modules/
│       ├── impact/
│       │   └── community_engine.py # Infrastructure proximity & vulnerability calculator
│       ├── historical/
│       │   └── timeline_engine.py  # Multi-year historical surveillance & hotspots
│       └── assistant/
│           └── query_engine.py     # Grounded AI Copilot query engine
├── frontend/
│   ├── index.html                  # Map-first geospatial command center
│   ├── css/
│   │   └── style.css               # Dark geospatial intelligence master styling
│   └── js/
│       ├── app.js                  # Master application orchestrator & router
│       └── modules/
│           ├── intelligence_map.js # Leaflet map, 16 layers, swipe curtain slider
│           ├── community_impact.js # Community exposure & vulnerability renderer
│           ├── historical_analytics.js # Timeline scrubber & Chart.js integration
│           ├── investigation_assistant.js # Conversational AI Copilot interface
│           └── reports_generator.js# Executive dossier generator & print exporter
├── data/
│   ├── generate_sample_data.py     # Procedural multispectral satellite synthesizer
│   └── samples/
│       ├── derna_flooding/         # 🌊 Flood Scenario
│       ├── amazon_deforestation/   # 🌳 Deforestation Scenario
│       ├── madurai_urban/          # 🏙️ Urban Expansion Scenario
│       └── california_wildfire/    # 🔥 Wildfire Scenario
└── README.md
```

---

## ⚖️ License & Disclaimers

All proximity calculations and infrastructure assessments generated by EarthLens AI are strictly designated as **Potentially Affected** via satellite distance heuristics. Tactical ground inspection and sensor fusion are recommended before field dispatch.

Released under the **MIT License**.
