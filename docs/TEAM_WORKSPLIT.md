# EarthGuard AI — Team Worksplit & Architecture Guide

This document defines the modular development breakdown for our **3-person hackathon team** to continue building features in parallel with **zero merge conflicts**.

---

## 🏗️ Repository Architecture & Separation of Concerns

To prevent merge conflicts, the codebase is strictly separated into independent modular boundaries:

```
SRIRAM_HACKATHON/
├── backend/
│   ├── cv_engine.py         <-- [MEMBER 1 OWNERSHIP: CV & Geospatial]
│   ├── classifier.py        <-- [MEMBER 1 OWNERSHIP: Spectral Classification]
│   ├── prioritization.py    <-- [MEMBER 2 OWNERSHIP: Urgency Ranking Algorithm]
│   ├── confidence.py        <-- [MEMBER 2 OWNERSHIP: Uncertainty & Cloud Heuristics]
│   ├── briefing_engine.py   <-- [MEMBER 2 OWNERSHIP: LLM & Operational Briefings]
│   ├── main.py              <-- [SHARED: API Endpoints - PR coordination required]
│   └── test_pipeline.py     <-- [ALL: Automated test verification]
│
├── frontend/
│   ├── index.html           <-- [MEMBER 3 OWNERSHIP: UI Layout & DOM structure]
│   ├── css/style.css        <-- [MEMBER 3 OWNERSHIP: Styling, Animations, Themes]
│   └── js/app.js            <-- [MEMBER 3 OWNERSHIP: Canvas, Leaflet Map, Interactivity]
│
├── data/
│   ├── samples/             <-- [MEMBER 1 OWNERSHIP: Pre-packaged Satellite Datasets]
│   └── generate_sample_data.py
│
└── docs/
    ├── TEAM_WORKSPLIT.md    <-- [THIS DOCUMENT]
    └── PITCH_SCRIPT.md      <-- [MEMBER 3 & ALL: 2-Minute Winning Pitch Script]
```

---

## 👥 3-Member Role & Task Breakdown

### 🛰️ Member 1: Computer Vision & Spectral Processing Lead
**Primary Focus**: Image differencing accuracy, multi-band spectral indices, cloud masking, and custom imagery ingestion.
- **Dedicated Files**:
  - `backend/cv_engine.py`
  - `backend/classifier.py`
  - `data/generate_sample_data.py`
- **Immediate Next Steps**:
  1. Add support for true Sentinel-2 12-band GeoTIFF reading via `rasterio` or GDAL if available.
  2. Implement Normalized Difference Water Index (NDWI) with shortwave infrared (SWIR) proxy bands to detect turbid flood boundaries even more sharply.
  3. Expand the dataset generator in `data/generate_sample_data.py` with 2 additional natural disaster scenarios (e.g. Hurricane storm surge, Glacier calving).
  4. Optimize contour segmentation to reduce false positives from uniform shadows.
- **Dedicated Git Branch**: `feature/cv-spectral-pipeline`

---

### 🧠 Member 2: AI Engine, Prioritization & Operational Reasoning Lead
**Primary Focus**: Composite urgency scoring, sensor confidence modeling, LLM prompt engineering, and operational protocol directives.
- **Dedicated Files**:
  - `backend/prioritization.py`
  - `backend/confidence.py`
  - `backend/briefing_engine.py`
- **Immediate Next Steps**:
  1. Connect live LLM API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`) via `.env` for dynamic, multi-lingual dispatch briefings.
  2. Enhance the explainable Urgency formula with population density heatmaps or critical infrastructure points (hospitals, power grids, evacuation routes).
  3. Add a structured JSON evacuation / dispatch checklist generator for international relief agencies (UN OCHA, FEMA, Red Cross).
  4. Write unit tests in `backend/test_pipeline.py` verifying edge-case scores (e.g. massive change in uninhabited desert vs. minor change in dense school zone).
- **Dedicated Git Branch**: `feature/scoring-llm-engine`

---

### 🎨 Member 3: Frontend UX, Geospatial Visualizations & Pitch Lead
**Primary Focus**: Aerospace Command Center UI, interactive Leaflet mapping, voice synthesis audio briefings, live telemetry, and pitch delivery.
- **Dedicated Files**:
  - `frontend/index.html`
  - `frontend/css/style.css`
  - `frontend/js/app.js`
  - `docs/PITCH_SCRIPT.md`
- **Immediate Next Steps**:
  1. Add 3D satellite elevation tilt / pitch effect or MapLibre GL 3D terrain switch for demo judges.
  2. Add sound effects (tactical aerospace clicks, radar sweep audio, alert chime for Critical Tier-1 cards).
  3. Enhance mobile/tablet responsive view for on-the-go tablet field demonstrations.
  4. Rehearse the 2-minute pitch script using `docs/PITCH_SCRIPT.md` and time the live clicks with Member 1 & 2!
- **Dedicated Git Branch**: `feature/ui-map-visualizer`

---

## 🔀 Git Branching & Merge Strategy (Zero Conflicts)

### 1. Branch Naming Convention
Always branch off `main` before starting your task:
```bash
# Member 1:
git checkout -b feature/cv-spectral-pipeline

# Member 2:
git checkout -b feature/scoring-llm-engine

# Member 3:
git checkout -b feature/ui-map-visualizer
```

### 2. Synchronization Protocol
Before pushing or creating a Pull Request:
```bash
git fetch origin
git merge origin/main
```
Because each member owns isolated files, automatic merges will succeed with **zero conflicts**!

### 3. Modifying `backend/main.py`
If a new endpoint is needed (e.g., Member 2 creates a new LLM endpoint), communicate in team chat before modifying `backend/main.py` to prevent overlapping edits.
