# 👥 EarthGuard AI — Team Worksplit & Zero-Merge-Conflict Architecture Guide

This guide establishes the modular development breakdown for our **3-person hackathon team** to develop features concurrently with **100% zero merge conflicts**.

---

## 🏗️ Strict Architectural Separation & Ownership

Merge conflicts occur when multiple developers edit the same file simultaneously. To prevent this entirely, our project is divided into **strictly isolated ownership zones**:

```
SRIRAM_HACKATHON/
│
├── backend/
│   ├── cv_engine.py          <-- 🟢 MEMBER 1 (CV & Spectral Differencing)
│   ├── classifier.py         <-- 🟢 MEMBER 1 (Spectral Event Classification)
│   ├── prioritization.py     <-- 🔵 MEMBER 2 (Urgency Scoring Formula)
│   ├── confidence.py         <-- 🔵 MEMBER 2 (Confidence & Uncertainty Modeling)
│   ├── briefing_engine.py    <-- 🔵 MEMBER 2 (Operational LLM Briefings)
│   ├── main.py               <-- 🔒 SHARED API CONTRACT (Locked Schema)
│   └── test_pipeline.py      <-- 🔵 MEMBER 2 & ALL (Integration Testing)
│
├── data/
│   ├── generate_sample_data.py <-- 🟢 MEMBER 1 (Dataset Synthesizer & Georeferencing)
│   └── samples/              <-- 🟢 MEMBER 1 (Sample Imagery & Metadata)
│
├── frontend/
│   ├── index.html            <-- 🟣 MEMBER 3 (Layout, Sidebar Nav & Inspector)
│   ├── css/style.css         <-- 🟣 MEMBER 3 (Aerospace Design System & Animations)
│   └── js/app.js             <-- 🟣 MEMBER 3 (Canvas, Map & Interactivity)
│
└── docs/
    ├── TEAM_WORKSPLIT.md     <-- 🔒 Shared Reference Guide
    └── PITCH_SCRIPT.md       <-- 🟣 MEMBER 3 & ALL (2-Minute Demo Script)
```

---

## 🔒 The Shared API Contract

Members 1 & 2 (Backend) and Member 3 (Frontend) communicate strictly through this defined JSON contract. As long as this schema remains stable, frontend and backend development are completely decoupled.

### Endpoint: `POST /api/analyze`
```json
{
  "status": "success",
  "dataset_id": "amazon_deforestation",
  "dataset_metadata": {
    "title": "Amazon Rainforest — Rondônia Fishbone Clearing",
    "location": "Rondônia, Brazil",
    "coordinates": { "lat": -10.8256, "lon": -62.9512, "zoom": 13 },
    "sensor": "Sentinel-2 MSI",
    "settlement_center": { "x": 630, "y": 190, "name": "Nova Esperança Community", "radius": 70 }
  },
  "before_image_url": "/samples/amazon_deforestation/before.png",
  "after_image_url": "/samples/amazon_deforestation/after.png",
  "heatmap_overlay": "data:image/png;base64,...",
  "telemetry": {
    "total_zones_detected": 15,
    "critical_count": 2,
    "moderate_count": 12,
    "low_count": 1,
    "total_hectares_impacted": 769.14,
    "mean_confidence_pct": 96
  },
  "ranked_zones": [
    {
      "rank": 1,
      "zone_id": "ZONE-01",
      "tier": "CRITICAL",
      "urgency_score": 65.9,
      "tier_color": "#ef4444",
      "hectares": 8.1,
      "bbox": [510, 240, 160, 150],
      "polygon": [[510, 240], [670, 240], [670, 390], [510, 390]],
      "classification": { "type": "Deforestation", "icon": "🌲", "signature": "..." },
      "confidence": { "percentage": 96, "level": "High Confidence", "reason": "..." },
      "incident_brief": {
        "brief_text": "...",
        "recommended_action": "...",
        "timeline": "Within 48 Hours"
      }
    }
  ]
}
```

---

## 👥 3-Member Role & Task Matrix

### 🟢 Member 1: Computer Vision & Spectral Processing Lead
- **Git Branch**: `feature/member1-cv-pipeline`
- **Exclusive Files**:
  - `backend/cv_engine.py`
  - `backend/classifier.py`
  - `data/generate_sample_data.py`
  - `data/samples/`
- **Core Tasks**:
  1. **Spectral Indices**: Implement Normalized Burn Ratio (NBR) and Normalized Difference Water Index (NDWI) proxies.
  2. **Contour Consolidation**: Fine-tune morphological closing filters so large contiguous clear-cuts form single unified priority zones.
  3. **Noise Suppression**: Filter out sub-pixel shadows and sensor glare (< 250 px).
  4. **Dataset Generation**: Add 1-2 new disaster scenarios (e.g. Valencia Inundation, Maui Wildfire) in `data/generate_sample_data.py`.

---

### 🔵 Member 2: AI Reasoning, Prioritization & Backend Lead
- **Git Branch**: `feature/member2-ai-prioritization`
- **Exclusive Files**:
  - `backend/prioritization.py`
  - `backend/confidence.py`
  - `backend/briefing_engine.py`
  - `backend/test_pipeline.py`
- **Core Tasks**:
  1. **Urgency Formula Tuning**: Calibrate weights across Magnitude (35%), Community Proximity (40%), and Size (25%).
  2. **Confidence Modeling**: Expand atmospheric uncertainty detection (cloud edge detection, specular variance).
  3. **LLM Integration**: Wire optional API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) via `.env` while preserving deterministic offline fallback.
  4. **Test Suite**: Maintain `backend/test_pipeline.py` ensuring all datasets pass with valid urgency scores.

---

### 🟣 Member 3: Frontend UX, Visualizations & Pitch Lead
- **Git Branch**: `feature/member3-frontend-ux`
- **Exclusive Files**:
  - `frontend/index.html`
  - `frontend/css/style.css`
  - `frontend/js/app.js`
  - `docs/PITCH_SCRIPT.md`
- **Core Tasks**:
  1. **Studio Enhancements**: Refine Side-by-Side Dual View and Curtain Swipe handle dragging mechanics.
  2. **Inspector Polishing**: Enhance the 4 tabs (*Metrics*, *AI Brief*, *Protocol*, *Spectral*) and test **🔊 Read Aloud** speech synthesis.
  3. **Geospatial Map**: Verify Leaflet satellite basemap, marker clusters, and tooltips.
  4. **Pitch Delivery**: Rehearse the 120-second demo script using `docs/PITCH_SCRIPT.md` and time live UI click cues.

---

## 🔀 Conflict-Free Git Workflow

### 1. Initial Branching
```bash
# Member 1:
git checkout -b feature/member1-cv-pipeline

# Member 2:
git checkout -b feature/member2-ai-prioritization

# Member 3:
git checkout -b feature/member3-frontend-ux
```

### 2. Pushing & Merging Protocol
Before pushing:
```bash
git fetch origin
git merge origin/main
git push -u origin <your-branch-name>
```

> **Why This Guarantees Zero Merge Conflicts:**
> Since each member only commits changes to their designated directory and files, Git will automatically fast-forward and merge changes with zero conflict resolution required.

---

## ⏱️ 6-Hour Hackathon Schedule

| Hour | Focus | Member 1 (CV) | Member 2 (AI/Backend) | Member 3 (Frontend/Pitch) |
| :--- | :--- | :--- | :--- | :--- |
| **0:00 - 1:00** | **Baseline Setup** | Verify CV differencing & sample data | Test urgency formulas & schema | Test local UI & navigation views |
| **1:00 - 2:30** | **Core Enhancements** | NBR & NDWI spectral indices | Refine scoring weights & cloud logic | Enhance Side-by-Side & Curtain slider |
| **2:30 - 3:30** | **Intelligence Layer**| Refine contour clustering & noise | Connect LLM keys & dispatch briefs | Integrate audio synthesis & docket |
| **3:30 - 4:30** | **Integration** | Test custom upload with sample imagery | Run `backend/test_pipeline.py` | Polish Leaflet popups & inspection tabs |
| **4:30 - 5:15** | **Sync & Merge** | Merge Member 1 branch to `main` | Merge Member 2 branch to `main` | Merge Member 3 branch to `main` |
| **5:15 - 6:00** | **Rehearsal & Pitch**| Live testing & edge-case checks | Validate latency & score ranges | Rehearse 2-minute pitch presentation |
