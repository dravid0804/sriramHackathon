# 👥 EarthGuard AI — Functional Team Worksplit & Zero-Merge-Conflict Guide

Welcome team! To ensure everyone can code concurrently **without git merge conflicts**, our project is partitioned by **Full-Stack Functional Feature Domains** rather than technical layers. 

Each member is an **End-to-End Feature Owner** (owning the backend algorithm, data structures, and frontend interactive component for their specific feature).

---

## 🏗️ Functional Feature Directory Isolation

Every feature has its own dedicated files in both the backend and frontend. You will **only** edit files belonging to your feature domain:

```
SRIRAM_HACKATHON/
│
├── backend/
│   ├── modules/
│   │   ├── detection/          <-- 🟢 MEMBER 1 (Feature 1 Backend)
│   │   │   ├── cv_engine.py
│   │   │   └── spectral_indices.py
│   │   │
│   │   ├── prioritization/     <-- 🔵 MEMBER 2 (Feature 2 Backend)
│   │   │   ├── urgency_ranker.py
│   │   │   ├── classifier.py
│   │   │   └── geospatial_coords.py
│   │   │
│   │   └── briefing/           <-- 🟣 MEMBER 3 (Feature 3 Backend)
│   │       ├── confidence_model.py
│   │       └── narrative_engine.py
│   │
│   ├── main.py                 <-- 🔒 Shared API Router (Fixed contract)
│   └── test_pipeline.py        <-- 🔒 Integration Test Suite
│
├── frontend/
│   ├── js/modules/
│   │   ├── detection_studio.js <-- 🟢 MEMBER 1 (Feature 1 Frontend)
│   │   ├── triage_map.js       <-- 🔵 MEMBER 2 (Feature 2 Frontend)
│   │   └── incident_briefs.js  <-- 🟣 MEMBER 3 (Feature 3 Frontend)
│   │
│   ├── css/modules/
│   │   ├── detection.css       <-- 🟢 MEMBER 1 (Feature 1 Styles)
│   │   ├── triage.css          <-- 🔵 MEMBER 2 (Feature 2 Styles)
│   │   └── briefs.css          <-- 🟣 MEMBER 3 (Feature 3 Styles)
│   │
│   ├── index.html              <-- 🔒 Base Layout Shell
│   ├── css/style.css           <-- 🔒 Base Design Tokens (Imports feature styles)
│   └── js/app.js               <-- 🔒 Master Event Hub (Coordinates feature modules)
│
├── data/                       <-- 🟢 MEMBER 1 (Datasets & Synthetic Scenarios)
│   ├── generate_sample_data.py
│   └── samples/
│
└── docs/
    ├── TEAM_WORKSPLIT.md       <-- 🔒 Team Onboarding Guide (This file)
    └── PITCH_SCRIPT.md         <-- 🟣 MEMBER 3 & ALL (2-Minute Demo Script)
```

---

## 🎯 Select Your Role

Select one role below. When you work with your AI assistant, begin your prompt with the **AI Persona Prompt** for your role!

---

### 🟢 MEMBER 1: Satellite Change Detection & Observation Studio Lead
- **Domain**: Computer vision differencing algorithms, multispectral math, and the interactive comparison studio.
- **Git Feature Branch**: `feature/member1-change-detection-studio`
- **Your Exclusive Files**:
  - `backend/modules/detection/cv_engine.py`
  - `backend/modules/detection/spectral_indices.py`
  - `frontend/js/modules/detection_studio.js`
  - `frontend/css/modules/detection.css`
  - `data/generate_sample_data.py`
  - `data/samples/`
- **AI Persona Prompt**:
  > *"I am Member 1, the Feature Owner for Satellite Change Detection & Observation Studio. I own `backend/modules/detection/` and `frontend/js/modules/detection_studio.js`. Let's enhance..."*
- **Your Core Tasks**:
  1. **Advanced Spectral Indices**: Enhance Normalized Burn Ratio (NBR) and Normalized Difference Water Index (NDWI) in `spectral_indices.py`.
  2. **Contour Consolidation**: Tune Otsu thresholding and morphological closing kernels in `cv_engine.py` so contiguous tracts merge cleanly without fragmented noise.
  3. **Observation Studio Interactivity**: Refine the Side-by-Side Dual View and Curtain Swipe handle dragging mechanics in `detection_studio.js`.
  4. **New Datasets**: Add 1-2 new disaster scenarios in `data/generate_sample_data.py` with known ground truths.

---

### 🔵 MEMBER 2: Severity-Ranked Prioritization & Geospatial Triage Lead
- **Domain**: Anomaly triage scoring, settlement proximity decay, and the fullscreen geospatial map/queue.
- **Git Feature Branch**: `feature/member2-prioritization-triage`
- **Your Exclusive Files**:
  - `backend/modules/prioritization/urgency_ranker.py`
  - `backend/modules/prioritization/classifier.py`
  - `backend/modules/prioritization/geospatial_coords.py`
  - `frontend/js/modules/triage_map.js`
  - `frontend/css/modules/triage.css`
- **AI Persona Prompt**:
  > *"I am Member 2, the Feature Owner for Severity-Ranked Prioritization & Geospatial Triage. I own `backend/modules/prioritization/` and `frontend/js/modules/triage_map.js`. Let's enhance..."*
- **Your Core Tasks**:
  1. **Urgency Score Formula**: Calibrate weights across Magnitude (35%), Community Proximity (40%), and Contiguous Area (25%) in `urgency_ranker.py`.
  2. **Event Classifier**: Expand classification heuristics in `classifier.py` to recognize Urban Development and Industrial expansion.
  3. **Geospatial Leaflet Map**: Enhance the fullscreen Leaflet map in `triage_map.js` with custom satellite markers, popups, and click-to-spotlight interactions.
  4. **Priority Triage Queue**: Improve sorting, filtering chips, and metrics display in the triage table.

---

### 🟣 MEMBER 3: Confidence Transparency & AI Incident Response Briefings Lead
- **Domain**: Atmospheric uncertainty modeling, natural-language operational briefs, audio speech synthesis, and pitch delivery.
- **Git Feature Branch**: `feature/member3-confidence-ai-briefs`
- **Your Exclusive Files**:
  - `backend/modules/briefing/confidence_model.py`
  - `backend/modules/briefing/narrative_engine.py`
  - `frontend/js/modules/incident_briefs.js`
  - `frontend/css/modules/briefs.css`
  - `docs/PITCH_SCRIPT.md`
- **AI Persona Prompt**:
  > *"I am Member 3, the Feature Owner for Confidence Transparency, AI Briefings & Incident Response. I own `backend/modules/briefing/` and `frontend/js/modules/incident_briefs.js`. Let's enhance..."*
- **Your Core Tasks**:
  1. **Confidence & Noise Model**: Tune cloud edge heuristics and sensor saturation penalties in `confidence_model.py`.
  2. **Decision-Ready Briefings**: Enhance operational guidance and connect optional LLM keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) in `narrative_engine.py`.
  3. **🔊 Read Aloud Voice Synthesis**: Test and calibrate the browser speech synthesis pitch and rate in `incident_briefs.js`.
  4. **Field Response & Docket**: Refine the operational checklist, dispatch button workflows, and printable executive docket styling.
  5. **Pitch Delivery**: Rehearse and lead the 2-minute pitch demonstration using `docs/PITCH_SCRIPT.md`.

---

## 🔀 Conflict-Free Git Workflow

### 1. Branch Initialization
When you start working on your laptop, create and switch to your feature branch:

```bash
# Member 1
git checkout -b feature/member1-change-detection-studio

# Member 2
git checkout -b feature/member2-prioritization-triage

# Member 3
git checkout -b feature/member3-confidence-ai-briefs
```

### 2. Regular Push & Merge Protocol
Whenever you want to commit your progress:

```bash
git add .
git commit -m "feat(member<N>): describe your functional update"
git fetch origin
git merge origin/main
git push -u origin feature/member<N>-<feature-name>
```

> **Why This Guarantees Zero Merge Conflicts:**  
> Because each member works in completely separate files, Git can automatically fast-forward and merge branches into `main` with zero manual conflict resolution required!

---

## ⏱️ 6-Hour Hackathon Roadmap

| Hour | Member 1 (Detection Studio) | Member 2 (Prioritization & Map) | Member 3 (Confidence & AI Briefs) |
| :--- | :--- | :--- | :--- |
| **0:00 - 1:30** | Multi-band spectral indices & curtain swipe handle | Urgency score weights & Leaflet map markers | Confidence noise thresholds & briefing templates |
| **1:30 - 3:00** | Contour smoothing & Side-by-side zoom synchronization | Community proximity decay & Triage Table sorting | Audio voice synthesis & Field response checklist |
| **3:00 - 4:15** | Custom upload normalization & new disaster datasets | Change-type classification badges & polygon popups | Printable executive docket modal & PDF styling |
| **4:15 - 5:00** | End-to-end testing of detection pipeline | Validate urgency ranking across all 3 datasets | Review voice briefings & error handling |
| **5:00 - 5:30** | Merge branch to `main` | Merge branch to `main` | Merge branch to `main` |
| **5:30 - 6:00** | Live demo testing & latency checks | Live demo testing & scoring checks | Final pitch rehearsal with UI cues |
