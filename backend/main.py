"""
EarthLens AI — AI for Space & Earth Intelligence
FastAPI Backend Application Entrypoint & Geospatial Intelligence API
"""

import os
import json
import cv2
import numpy as np
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from .cv_engine import process_satellite_pair
from .modules.impact.community_engine import analyze_community_impact
from .modules.historical.timeline_engine import get_historical_timeline_data
from .modules.assistant.query_engine import answer_investigation_query

app = FastAPI(
    title="EarthLens AI API",
    description="Satellite Change Detection, Community Impact Intelligence, and Environmental Monitoring Platform",
    version="2.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "samples")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
UPLOADS_DIR = os.path.join(BASE_DIR, "data", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Mount sample images
if os.path.exists(DATA_DIR):
    app.mount("/samples", StaticFiles(directory=DATA_DIR), name="samples")

class AnalyzeRequest(BaseModel):
    dataset_id: str

class AssistantQueryRequest(BaseModel):
    query: str
    dataset_id: Optional[str] = "derna_flooding"

class AlertStatusUpdate(BaseModel):
    status: str  # "ACTIVE", "UNDER_REVIEW", "DISPATCHED", "RESOLVED"

# In-memory alerts registry for demo persistence
ALERTS_STORE = [
    {
        "id": "alert-001",
        "dataset_id": "derna_flooding",
        "alert_type": "EMERGENCY_CRITICAL",
        "title": "Rapid Flood Inundation & Dam Overtopping",
        "location": "Derna Coastal District, Libya",
        "coordinates": {"lat": 32.7667, "lon": 22.6367},
        "detection_time": "2026-09-23T06:15:00Z",
        "change_type": "Flooding",
        "severity": "CRITICAL",
        "confidence": 94,
        "affected_area_km2": 14.2,
        "community_impact": "6 settlements, 3 schools, 1 hospital potentially affected",
        "status": "ACTIVE",
        "color": "#ef4444"
    },
    {
        "id": "alert-002",
        "dataset_id": "amazon_deforestation",
        "alert_type": "SURVEILLANCE_CRITICAL",
        "title": "Fishbone Deforestation Encroachment",
        "location": "Rondônia Indigenous Arc, Brazil",
        "coordinates": {"lat": -10.8256, "lon": -62.9512},
        "detection_time": "2026-09-22T18:40:00Z",
        "change_type": "Deforestation",
        "severity": "CRITICAL",
        "confidence": 91,
        "affected_area_km2": 8.1,
        "community_impact": "Nova Esperança Indigenous Hamlet buffer breach within 1.1km",
        "status": "ACTIVE",
        "color": "#ef4444"
    },
    {
        "id": "alert-003",
        "dataset_id": "madurai_urban",
        "alert_type": "LAND_USE_WARNING",
        "title": "Accelerated Peri-Urban Encroachment on Recharge Wetlands",
        "location": "Madurai Region, Tamil Nadu, India",
        "coordinates": {"lat": 9.9252, "lon": 78.1198},
        "detection_time": "2026-09-21T11:20:00Z",
        "change_type": "Urban Expansion",
        "severity": "MODERATE",
        "confidence": 92,
        "affected_area_km2": 4.8,
        "community_impact": "Vilangudi wetland catchment area reduced by 28%",
        "status": "UNDER_REVIEW",
        "color": "#f97316"
    },
    {
        "id": "alert-004",
        "dataset_id": "california_wildfire",
        "alert_type": "THERMAL_WARNING",
        "title": "Wildland-Urban Interface Canopy Burn Scar",
        "location": "Butte County, California, USA",
        "coordinates": {"lat": 39.7596, "lon": -121.6219},
        "detection_time": "2026-09-20T14:05:00Z",
        "change_type": "Wildfire Burn Scar",
        "severity": "MODERATE",
        "confidence": 89,
        "affected_area_km2": 6.4,
        "community_impact": "Skyway Ridge evacuation route under smoke advisory",
        "status": "DISPATCHED",
        "color": "#f97316"
    }
]

@app.get("/api/health")
def health_check():
    """Health status and capabilities endpoint."""
    return {
        "status": "healthy",
        "service": "EarthLens AI Geospatial Intelligence Engine",
        "version": "2.0.0",
        "features": {
            "satellite_cv_diff": True,
            "community_impact_engine": True,
            "vulnerability_mapping": True,
            "historical_timeline": True,
            "grounded_ai_assistant": True,
            "investigation_reports": True
        }
    }

@app.get("/api/datasets")
def list_datasets():
    """Returns available pre-packaged satellite demo datasets."""
    datasets = []
    if os.path.exists(DATA_DIR):
        for entry in os.listdir(DATA_DIR):
            folder = os.path.join(DATA_DIR, entry)
            meta_path = os.path.join(folder, "metadata.json")
            if os.path.isdir(folder) and os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    meta["before_url"] = f"/samples/{entry}/before.png"
                    meta["after_url"] = f"/samples/{entry}/after.png"
                    datasets.append(meta)
    return {"datasets": datasets}

def sanitize_for_json(obj):
    """Recursively converts numpy numbers and arrays to standard Python types for JSON serialization."""
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

@app.post("/api/analyze")
def analyze_dataset(req: AnalyzeRequest):
    """Executes computer vision differencing and community impact analysis on a dataset."""
    folder = os.path.join(DATA_DIR, req.dataset_id)
    if not os.path.exists(folder):
        raise HTTPException(status_code=404, detail=f"Dataset '{req.dataset_id}' not found.")
        
    before_path = os.path.join(folder, "before.png")
    after_path = os.path.join(folder, "after.png")
    meta_path = os.path.join(folder, "metadata.json")
    
    if not os.path.exists(before_path) or not os.path.exists(after_path):
        raise HTTPException(status_code=400, detail="Missing before/after image files.")
        
    metadata = {}
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            
    b_img = cv2.imread(before_path)
    a_img = cv2.imread(after_path)
    
    if b_img is None or a_img is None:
        raise HTTPException(status_code=500, detail="Failed to decode satellite images.")
        
    b_rgb = cv2.cvtColor(b_img, cv2.COLOR_BGR2RGB)
    a_rgb = cv2.cvtColor(a_img, cv2.COLOR_BGR2RGB)
    
    # Process through core CV and ranking pipeline
    result = process_satellite_pair(b_rgb, a_rgb, metadata)
    result["dataset_id"] = req.dataset_id
    result["before_image_url"] = f"/samples/{req.dataset_id}/before.png"
    result["after_image_url"] = f"/samples/{req.dataset_id}/after.png"
    
    # Compute community impact and vulnerability intelligence
    impact_data = analyze_community_impact(req.dataset_id, result.get("ranked_zones", []), metadata)
    result["community_impact"] = impact_data
    
    return sanitize_for_json(result)

@app.get("/api/impact/{dataset_id}")
def get_community_impact(dataset_id: str):
    """Returns community exposure, infrastructure proximity, and vulnerability layer data."""
    folder = os.path.join(DATA_DIR, dataset_id)
    metadata = {}
    if os.path.exists(folder):
        meta_path = os.path.join(folder, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
                
    impact_data = analyze_community_impact(dataset_id, [], metadata)
    return sanitize_for_json(impact_data)

@app.get("/api/historical")
def get_historical_analysis():
    """Returns multi-year (2024-2026) surveillance analytics, trends, and hotspot clusters."""
    return get_historical_timeline_data()

@app.post("/api/assistant/query")
def query_ai_assistant(req: AssistantQueryRequest):
    """Answers user queries grounded in active dataset telemetry without hallucinations."""
    dataset_id = req.dataset_id or "derna_flooding"
    folder = os.path.join(DATA_DIR, dataset_id)
    metadata = {}
    if os.path.exists(folder):
        meta_path = os.path.join(folder, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)

    # Mock active dataset state
    active_dataset = {
        "metadata": metadata,
        "ranked_zones": [
            {"zone_id": 1, "tier": "CRITICAL", "hectares": 142.0, "urgency_score": 94, "classification": {"type": metadata.get("change_type", "Flood")}},
            {"zone_id": 2, "tier": "MODERATE", "hectares": 86.0, "urgency_score": 72, "classification": {"type": metadata.get("change_type", "Flood")}}
        ],
        "telemetry": {
            "total_hectares_impacted": 480.0,
            "critical_count": 2,
            "moderate_count": 3,
            "low_count": 1
        }
    }
    impact_data = analyze_community_impact(dataset_id, active_dataset["ranked_zones"], metadata)
    return answer_investigation_query(req.query, active_dataset, impact_data)

@app.get("/api/alerts")
def get_alerts():
    """Returns active emergency and surveillance alerts queue."""
    return {"alerts": ALERTS_STORE}

@app.post("/api/alerts/{alert_id}/status")
def update_alert_status(alert_id: str, update: AlertStatusUpdate):
    """Updates status for a specific alert."""
    for alert in ALERTS_STORE:
        if alert["id"] == alert_id:
            alert["status"] = update.status
            return {"success": True, "alert": alert}
    raise HTTPException(status_code=404, detail="Alert not found")

@app.get("/api/historical/timeline")
def get_historical_timeline():
    """Returns multi-year historical surveillance, hotspot evolution, velocity, anomalies, and change events."""
    return get_historical_timeline_data()

@app.get("/api/datasources")
def get_data_sources():
    """Returns official Earth observation data sources and integration statuses."""
    sources = [
        {
            "name": "Copernicus Sentinel-2 MSI",
            "provider": "European Space Agency (ESA)",
            "data_type": "Optical Multispectral (10m Resolution, 13 Bands)",
            "last_updated": "2026-09-23T04:30:00Z",
            "coverage": "Global Land & Coastal Waters (5-Day Revisit)",
            "status": "OPERATIONAL / LIVE INGESTION"
        },
        {
            "name": "Copernicus Sentinel-1 SAR",
            "provider": "European Space Agency (ESA)",
            "data_type": "C-band Synthetic Aperture Radar (All-Weather Flood Penetration)",
            "last_updated": "2026-09-23T02:15:00Z",
            "coverage": "Global Emergency & Seismic Corridors",
            "status": "OPERATIONAL / LIVE INGESTION"
        },
        {
            "name": "USGS / NASA Landsat 8/9 OLI-2 / TIRS-2",
            "provider": "USGS Earth Resources Observation & Science (EROS)",
            "data_type": "Multispectral & Thermal Infrared (30m Optical, 100m Thermal)",
            "last_updated": "2026-09-22T21:00:00Z",
            "coverage": "Global Continental Landmass (8-Day Offset)",
            "status": "OPERATIONAL"
        },
        {
            "name": "NASA MODIS / VIIRS Active Fire",
            "provider": "NASA FIRMS (Fire Information for Resource Management System)",
            "data_type": "Thermal Anomaly & Radiative Power (375m Resolution)",
            "last_updated": "2026-09-23T06:00:00Z",
            "coverage": "Global Near-Real-Time (3-Hour Latency)",
            "status": "OPERATIONAL"
        },
        {
            "name": "OpenStreetMap Humanitarian Data Exchange (HDX)",
            "provider": "Humanitarian OpenStreetMap Team (HOT) & UN OCHA",
            "data_type": "Critical Infrastructure: Schools, Hospitals, Bridges & Road Networks",
            "last_updated": "2026-09-20T12:00:00Z",
            "coverage": "Global Open Cadastral Vector Basemap",
            "status": "SYNCHRONIZED"
        },
        {
            "name": "ESRI World Imagery & CartoDB Vector Basemaps",
            "provider": "ESRI / Maxar Technologies & CartoDB",
            "data_type": "High-Resolution Satellite Basemap & Dark Geospatial Canvas",
            "last_updated": "2026-08-15T00:00:00Z",
            "coverage": "Worldwide Seamless Ortho-mosaic",
            "status": "ACTIVE TILES"
        }
    ]
    return {"sources": sources}

@app.post("/api/reports/generate")
def generate_investigation_report(payload: dict):
    """Generates an executive investigation report dossier."""
    dataset_id = payload.get("dataset_id", "derna_flooding")
    folder = os.path.join(DATA_DIR, dataset_id)
    metadata = {}
    if os.path.exists(folder):
        meta_path = os.path.join(folder, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
                
    impact_data = analyze_community_impact(dataset_id, payload.get("ranked_zones", []), metadata)
    
    report = {
        "report_id": f"ELENS-DOSSIER-{int(cv2.getTickCount() % 1000000)}",
        "generated_timestamp": "2026-09-23T07:15:00Z",
        "location": metadata.get("location", "Target Region"),
        "title": metadata.get("title", "Earth Observation Investigation"),
        "dates": {
            "before_date": metadata.get("date_before", "N/A"),
            "after_date": metadata.get("date_after", "N/A")
        },
        "sensor_platform": metadata.get("sensor", "Sentinel-2 MSI"),
        "hazard_type": metadata.get("change_type", "Environmental Anomaly"),
        "affected_area_km2": impact_data["community_impact_summary"]["total_affected_area_km2"],
        "investigation_priority": impact_data["investigation_priority"],
        "community_exposure": impact_data["community_impact_summary"],
        "nearby_facilities": impact_data["nearby_facilities"],
        "ai_narrative": (
            f"Automated multispectral change detection confirms rapid land-cover transformation in {metadata.get('location')} "
            f"between {metadata.get('date_before')} and {metadata.get('date_after')}. A total of "
            f"{impact_data['community_impact_summary']['total_affected_area_km2']} km² has been flagged as transformed. "
            f"Proximity analysis indicates {impact_data['community_impact_summary']['settlements_count']} settlements, "
            f"{impact_data['community_impact_summary']['schools_count']} educational facilities, and "
            f"{impact_data['community_impact_summary']['hospitals_count']} emergency hospital within the potential exposure envelope. "
            f"Priority classification is {impact_data['investigation_priority']['tier']}."
        ),
        "disclaimer": "This intelligence dossier is generated by EarthLens AI for decision support. Ground inspection required before dispatch."
    }
    return report

# Mount frontend files at root
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
