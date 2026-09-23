"""
EarthGuard AI — Satellite Change Detection & Prioritized Response System
FastAPI Backend Application Entrypoint
"""

import os
import json
import cv2
import numpy as np
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from .cv_engine import process_satellite_pair

app = FastAPI(
    title="EarthGuard AI API",
    description="Satellite Change Detection, Severity-Ranked Prioritization, and LLM Incident Briefing System",
    version="1.0.0"
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

@app.get("/api/health")
def health_check():
    """Health status and telemetry endpoint."""
    return {
        "status": "healthy",
        "service": "EarthGuard AI Engine",
        "version": "1.0.0",
        "features": {
            "spectral_diff": True,
            "severity_ranking": True,
            "confidence_heuristics": True,
            "incident_briefs": True,
            "change_classifier": True
        }
    }

@app.get("/api/datasets")
def list_datasets():
    """Returns available pre-packaged satellite datasets."""
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

@app.post("/api/analyze")
def analyze_dataset(req: AnalyzeRequest):
    """Executes the full pipeline on a selected pre-packaged dataset."""
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
            
    # Load images with OpenCV (convert BGR to RGB)
    b_img = cv2.imread(before_path)
    a_img = cv2.imread(after_path)
    
    if b_img is None or a_img is None:
        raise HTTPException(status_code=500, detail="Failed to decode satellite images.")
        
    b_rgb = cv2.cvtColor(b_img, cv2.COLOR_BGR2RGB)
    a_rgb = cv2.cvtColor(a_img, cv2.COLOR_BGR2RGB)
    
    # Process through pipeline
    result = process_satellite_pair(b_rgb, a_rgb, metadata)
    result["dataset_id"] = req.dataset_id
    result["before_image_url"] = f"/samples/{req.dataset_id}/before.png"
    result["after_image_url"] = f"/samples/{req.dataset_id}/after.png"
    return result

@app.post("/api/upload")
async def upload_custom_pair(
    before_file: UploadFile = File(...),
    after_file: UploadFile = File(...),
    title: Optional[str] = Form("Custom User Satellite Observation"),
    settlement_x: Optional[int] = Form(400),
    settlement_y: Optional[int] = Form(400)
):
    """Analyzes a custom user-uploaded before/after image pair."""
    try:
        b_bytes = await before_file.read()
        a_bytes = await after_file.read()
        
        b_arr = np.frombuffer(b_bytes, np.uint8)
        a_arr = np.frombuffer(a_bytes, np.uint8)
        
        b_img = cv2.imdecode(b_arr, cv2.IMREAD_COLOR)
        a_img = cv2.imdecode(a_arr, cv2.IMREAD_COLOR)
        
        if b_img is None or a_img is None:
            raise HTTPException(status_code=400, detail="Unable to decode uploaded images.")
            
        # Ensure dimensions match
        if b_img.shape != a_img.shape:
            a_img = cv2.resize(a_img, (b_img.shape[1], b_img.shape[0]))
            
        b_rgb = cv2.cvtColor(b_img, cv2.COLOR_BGR2RGB)
        a_rgb = cv2.cvtColor(a_img, cv2.COLOR_BGR2RGB)
        
        # Save locally in uploads
        upload_id = f"custom_{int(cv2.getTickCount())}"
        custom_folder = os.path.join(UPLOADS_DIR, upload_id)
        os.makedirs(custom_folder, exist_ok=True)
        cv2.imwrite(os.path.join(custom_folder, "before.png"), b_img)
        cv2.imwrite(os.path.join(custom_folder, "after.png"), a_img)
        
        meta = {
            "id": upload_id,
            "title": title,
            "location": "Custom Upload Coordinates",
            "coordinates": {"lat": 0.0, "lon": 0.0, "zoom": 12},
            "sensor": "User Upload Sensor",
            "settlement_center": {
                "x": settlement_x or b_img.shape[1] // 2,
                "y": settlement_y or b_img.shape[0] // 2,
                "name": "Target Focal Center",
                "radius": 100
            },
            "description": "User uploaded satellite observation processed via EarthGuard AI pipeline."
        }
        
        result = process_satellite_pair(b_rgb, a_rgb, meta)
        result["dataset_id"] = upload_id
        # Provide base64 preview urls
        _, b_enc = cv2.imencode('.png', b_img)
        _, a_enc = cv2.imencode('.png', a_img)
        import base64
        result["before_image_url"] = f"data:image/png;base64,{base64.b64encode(b_enc).decode('utf-8')}"
        result["after_image_url"] = f"data:image/png;base64,{base64.b64encode(a_enc).decode('utf-8')}"
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload processing error: {str(e)}")

@app.post("/api/export-report")
def export_incident_report(payload: dict):
    """Generates an executive incident dispatch briefing report payload."""
    zones = payload.get("ranked_zones", [])
    telemetry = payload.get("telemetry", {})
    meta = payload.get("dataset_metadata", {})
    
    report = {
        "report_id": f"EGUARD-DISPATCH-{int(cv2.getTickCount() % 1000000)}",
        "generated_timestamp": "2026-09-23T07:05:00Z",
        "mission_title": f"Incident Dispatch Briefing: {meta.get('title', 'Unknown Area')}",
        "location": meta.get("location", "Coordinates Unspecified"),
        "triage_summary": {
            "total_anomalies_flagged": len(zones),
            "critical_immediate_threats": telemetry.get("critical_count", 0),
            "moderate_surveillance": telemetry.get("moderate_count", 0),
            "low_routine": telemetry.get("low_count", 0),
            "total_hectares_impacted": telemetry.get("total_hectares_impacted", 0.0),
            "confidence_index": f"{telemetry.get('mean_confidence_pct', 90)}%"
        },
        "critical_action_items": [
            {
                "zone_id": z.get("zone_id"),
                "urgency_score": z.get("urgency_score"),
                "classification": z.get("classification", {}).get("type"),
                "area_ha": z.get("hectares"),
                "brief": z.get("incident_brief", {}).get("brief_text"),
                "action": z.get("incident_brief", {}).get("recommended_action"),
                "dispatch_window": z.get("incident_brief", {}).get("timeline")
            }
            for z in zones if z.get("tier") == "CRITICAL"
        ]
    }
    return report

# Mount frontend files at root
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
