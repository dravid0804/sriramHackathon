# 👥 EarthLens AI — Functional Team Worksplit & Zero-Merge-Conflict Architecture

Welcome team! To ensure all three team members can develop concurrently **without git merge conflicts**, the **EarthLens AI** codebase is partitioned by **Full-Stack Functional Feature Domains** rather than technical layers (no frontend vs backend separation).

Each member is an **End-to-End Feature Owner** owning the backend algorithms, data models, frontend UI module, and styling for their dedicated feature domain.

---

## 🏛️ Directory Isolation & File Ownership Matrix

Every team member has exclusive write access to their own files. Follow this golden rule:  
**Only edit files assigned to your role.**

```
SRIRAM_HACKATHON/
│
├── backend/
│   ├── modules/
│   │   ├── detection/                 <-- 🟢 MEMBER 1 (Feature 1 Backend)
│   │   │   ├── cv_engine.py           # Differencing, Otsu adaptive thresholding, bounding boxes
│   │   │   ├── classifier.py          # Multi-hazard environmental change classifier
│   │   │   └── spectral_indices.py    # NDVI & NDWI proxy vegetation/water metrics
│   │   │
│   │   ├── impact/                    <-- 🔵 MEMBER 2 (Feature 2 Backend)
│   │   │   ├── community_engine.py    # Proximity modeling, exposure metrics, vulnerability tiers
│   │   │   └── cadastral_loader.py    # OpenStreetMap / HDX infrastructure vector loader
│   │   │
│   │   ├── historical/                <-- 🟣 MEMBER 3 (Feature 3 Backend)
│   │   │   └── timeline_engine.py     # Multi-year metrics (2024-2026) & hotspot clusters
│   │   │
│   │   └── assistant/                 <-- 🟣 MEMBER 3 (Feature 3 Backend)
│   │       └── query_engine.py        # Grounded AI Copilot Q&A engine (zero hallucinations)
│   │
│   ├── main.py                        <-- 🔒 Fixed Shared API Contract (Read-Only)
│   └── test_pipeline.py               <-- 🔒 Shared Regression Test Suite (Read-Only)
│
├── frontend/
│   ├── js/modules/
│   │   ├── intelligence_map.js        <-- 🟢 MEMBER 1 (Feature 1 Frontend)
│   │   ├── community_impact.js        <-- 🔵 MEMBER 2 (Feature 2 Frontend)
│   │   ├── historical_analytics.js    <-- 🟣 MEMBER 3 (Feature 3 Frontend)
│   │   ├── investigation_assistant.js <-- 🟣 MEMBER 3 (Feature 3 Frontend)
│   │   └── reports_generator.js       <-- 🟣 MEMBER 3 (Feature 3 Frontend)
│   │
│   ├── css/modules/
│   │   ├── map_studio.css             <-- 🟢 MEMBER 1 (Feature 1 Styles)
│   │   ├── community_impact.css       <-- 🔵 MEMBER 2 (Feature 2 Styles)
│   │   └── analytics_copilot.css      <-- 🟣 MEMBER 3 (Feature 3 Styles)
│   │
│   ├── index.html                     <-- 🔒 Base Layout Shell (Fixed DOM IDs)
│   ├── css/style.css                  <-- 🔒 Master Stylesheet (Imports modular feature CSS)
│   └── js/app.js                      <-- 🔒 Master Orchestrator (Dispatches shared events)
│
├── data/                              <-- 🟢 MEMBER 1 (Datasets & Synthetic Scenarios)
│   ├── generate_sample_data.py
│   └── samples/
│       ├── derna_flooding/
│       ├── amazon_deforestation/
│       ├── madurai_urban/
│       └── california_wildfire/
│
└── docs/
    ├── TEAM_WORKSPLIT.md              <-- 🔒 This Team Worksplit Document
    └── walkthrough.md                 <-- 🔒 Project Capabilities Walkthrough
```

---

## 🎯 Role Selection & Feature Ownership

Choose one of the 3 roles below. When you work with your AI assistant, begin your prompt with the **AI Persona Prompt** for your role!

---

### 🟢 MEMBER 1: Detection Studio, Computer Vision & Live Geospatial Map Engine Lead

* **Functional Scope**:
  - Satellite pair ingestion and pre-processing
  - Classical CV differencing (Otsu adaptive thresholding, contour extraction, bounding boxes)
  - Multi-hazard classifier (Flooding, Deforestation, Urban Expansion, Wildfire, Coastal)
  - Interactive Leaflet Map centerpiece with ESRI Satellite & CartoDB Dark Matter basemaps
  - 16-Layer toggle system & drawer
  - Top comparison mode switcher: `[ BEFORE ] [ AFTER ] [ DIFFERENCE ] [ IMPACT ]`
  - Draggable Before/After curtain comparison swipe slider
  - Demo scenario data synthesis (`data/generate_sample_data.py` & `data/samples/`)
* **Git Feature Branch**: `feature/member1-map-detection-studio`
* **Your Exclusive Files (Zero Conflicts)**:
  - `backend/modules/detection/cv_engine.py`
  - `backend/modules/detection/classifier.py`
  - `backend/modules/detection/spectral_indices.py`
  - `frontend/js/modules/intelligence_map.js`
  - `frontend/css/modules/map_studio.css`
  - `data/generate_sample_data.py`
  - `data/samples/**`
* **Your AI Persona Prompt**:
  > *"I am Member 1, the Feature Owner for Detection Studio, Computer Vision & Live Geospatial Map Engine in EarthLens AI. I exclusively own `backend/modules/detection/`, `frontend/js/modules/intelligence_map.js`, `frontend/css/modules/map_studio.css`, and `data/`. Let's work on..."*
* **Your Key Tasks**:
  1. **Enhanced Edge & Contour Differencing**: Tune morphological closing kernels in `cv_engine.py` to prevent fragmented anomaly noise and produce crisp change polygons.
  2. **Spectral Classifier Refinement**: Improve distinction between urban concrete development vs dry bare soil in `classifier.py`.
  3. **Swipe Curtain Performance**: Optimize the draggable divider curtain in `intelligence_map.js` for high frame rates on large displays.
  4. **New Datasets**: Add or fine-tune high-resolution satellite sample pairs in `data/generate_sample_data.py`.

---

### 🔵 MEMBER 2: Community Impact Intelligence, Vulnerability & Critical Infrastructure Lead

* **Functional Scope**:
  - Community impact calculation engine (answers *"Who and what could be affected by this environmental change?"*)
  - Critical infrastructure proximity modeling:
    - 🏘️ Nearby Settlements / Population clusters
    - 🏫 Schools & educational facilities
    - 🏥 Hospitals & emergency health centers (ICU status, severed road warnings)
    - 🛣️ Primary & secondary transit bridges (washout / impassable status)
    - 🌾 Agricultural reserves & farmland
    - 💧 Water reservoirs & treatment infrastructure
  - Demographic Vulnerability Heatmap (High, Moderate, Low vulnerability buffer zones)
  - Transparent Multi-Factor Investigation Priority Formula (Area + Velocity + Infrastructure Proximity + AI Confidence)
  - Right-side Change Detail Drawer (Anomaly telemetry, severity, and potential impacts)
* **Git Feature Branch**: `feature/member2-community-vulnerability`
* **Your Exclusive Files (Zero Conflicts)**:
  - `backend/modules/impact/community_engine.py`
  - `backend/modules/impact/cadastral_loader.py`
  - `backend/modules/impact/__init__.py`
  - `frontend/js/modules/community_impact.js`
  - `frontend/css/modules/community_impact.css`
* **Your AI Persona Prompt**:
  > *"I am Member 2, the Feature Owner for Community Impact Intelligence, Vulnerability & Critical Infrastructure in EarthLens AI. I exclusively own `backend/modules/impact/`, `frontend/js/modules/community_impact.js`, and `frontend/css/modules/community_impact.css`. Let's work on..."*
* **Your Key Tasks**:
  1. **Proximity Decay Formula**: Enhance distance attenuation in `community_engine.py` to weight hospitals and bridges higher than general land parcels.
  2. **Demographic Vulnerability Modeling**: Refine the buffer radii and socioeconomic vulnerability rationale for High, Moderate, and Low tiers.
  3. **Impact Inventory UI**: Polish the facility breakdown cards in `community_impact.js` with capacity badges and emergency routing alerts.
  4. **Strict Labeling Rigor**: Maintain clear "Potentially Affected" disclaimers on all outputs to prevent speculative casualty figures.

---

### 🟣 MEMBER 3: Intelligence Operations: Historical Analytics, Alerts, Grounded AI Copilot & Dossiers Lead

* **Functional Scope**:
  - Multi-year historical surveillance (2024 $\rightarrow$ 2025 $\rightarrow$ 2026 timeline scrubber)
  - Interactive Chart.js visualizations (Area over time, Categories doughnut, Priority trends)
  - Geographic Change Hotspot Clusters (Hotspots Alpha, Bravo, Charlie, Delta with click-to-zoom)
  - Active Alerts Queue (Critical threats, moderate warnings, actions: View on Map, Investigate, Mark as Reviewed)
  - Grounded AI Investigation Assistant (conversational Copilot answering prompt pills with verified dataset telemetry and zero hallucinations)
  - Executive Investigation Reports Dossier (official brief with metadata, infrastructure audit, and PDF print export)
  - Data Sources catalog (Copernicus, Landsat, MODIS, OSM HDX, ESRI)
* **Git Feature Branch**: `feature/member3-intelligence-ops-copilot`
* **Your Exclusive Files (Zero Conflicts)**:
  - `backend/modules/historical/timeline_engine.py`
  - `backend/modules/historical/__init__.py`
  - `backend/modules/assistant/query_engine.py`
  - `backend/modules/assistant/__init__.py`
  - `frontend/js/modules/historical_analytics.js`
  - `frontend/js/modules/investigation_assistant.js`
  - `frontend/js/modules/reports_generator.js`
  - `frontend/css/modules/analytics_copilot.css`
* **Your AI Persona Prompt**:
  > *"I am Member 3, the Feature Owner for Historical Analytics, Alerts, Grounded AI Copilot & Dossiers in EarthLens AI. I exclusively own `backend/modules/historical/`, `backend/modules/assistant/`, `frontend/js/modules/historical_analytics.js`, `frontend/js/modules/investigation_assistant.js`, `frontend/js/modules/reports_generator.js`, and `frontend/css/modules/analytics_copilot.css`. Let's work on..."*
* **Your Key Tasks**:
  1. **Historical Chart Analytics**: Add interactive year-over-year percentage delta tooltips to the Chart.js graphs in `historical_analytics.js`.
  2. **Grounded AI Copilot Queries**: Expand query parsing in `query_engine.py` to answer questions about specific evacuation roads and infrastructure names.
  3. **Alerts Lifecycle Management**: Implement status persistence for Reviewed/Dispatched alerts in `app.js` and `main.py`.
  4. **Executive Dossier Export**: Refine the print-optimized CSS layout in `analytics_copilot.css` for one-click PDF generation.

---

## 🔄 Zero-Merge-Conflict Git Protocol

### 1. Checkout Your Feature Branch
```bash
# Member 1:
git checkout -b feature/member1-map-detection-studio

# Member 2:
git checkout -b feature/member2-community-vulnerability

# Member 3:
git checkout -b feature/member3-intelligence-ops-copilot
```

### 2. Work & Commit Regularly
```bash
git add <your-exclusive-files>
git commit -m "feat(domain): enhance feature capability"
```

### 3. Merge Back to Main
Because each member modified entirely distinct files across different folders, merging your branches into `main` will be a clean, automatic fast-forward merge with **ZERO merge conflicts**:
```bash
git checkout main
git pull origin main
git merge <your-feature-branch>
git push origin main
```

---

## 🧪 Integration Verification Contract

Whenever any member finishes an update, run the verification suite:
```bash
python -m backend.test_pipeline
```
If all 4 datasets pass with `100% SUCCESS`, your feature slice is fully backward-compatible and ready to ship!
