"""
EarthGuard AI — Master Pipeline Orchestrator
Coordinates the 3 Functional Feature Modules:
- Member 1: Detection & Spectral Contours (backend.modules.detection)
- Member 2: Urgency Ranking & Geospatial Coordinates (backend.modules.prioritization)
- Member 3: Confidence Transparency & AI Incident Briefings (backend.modules.briefing)
"""

import numpy as np
from typing import Dict, Any

from .modules.detection import extract_anomaly_contours
from .modules.prioritization import rank_and_prioritize_zones
from .modules.briefing import evaluate_detection_confidence, generate_decision_brief

def process_satellite_pair(before_rgb: np.ndarray, 
                           after_rgb: np.ndarray, 
                           metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Executes the end-to-end EarthGuard AI pipeline across all 3 functional domains.
    """
    if metadata is None:
        metadata = {}
        
    h, w, _ = before_rgb.shape
    
    # 🟢 FEATURE 1 (Member 1): Change Detection & Contour Extraction
    change_type = metadata.get("change_type", "general")
    raw_zones, heatmap_uri, telemetry_base = extract_anomaly_contours(before_rgb, after_rgb, change_type)
    
    # 🟣 FEATURE 3 (Member 3): Confidence & Uncertainty Modeling
    for zone in raw_zones:
        conf = evaluate_detection_confidence(
            zone["before_crop"], 
            zone["after_crop"], 
            zone["diff_crop"]
        )
        zone["confidence"] = conf

    # 🔵 FEATURE 2 (Member 2): Severity-Ranked Prioritization & Geospatial Coordinates
    ranked_zones = rank_and_prioritize_zones(raw_zones, metadata, w, h)
    
    # 🟣 FEATURE 3 (Member 3): Natural-Language Operational Briefing
    for zone in ranked_zones:
        zone["incident_brief"] = generate_decision_brief(zone, metadata)
        # Clean up numpy array crops before JSON serialization
        zone.pop("before_crop", None)
        zone.pop("after_crop", None)
        zone.pop("diff_crop", None)
        
    # Global Telemetry Consolidation
    critical_count = sum(1 for z in ranked_zones if z["tier"] == "CRITICAL")
    moderate_count = sum(1 for z in ranked_zones if z["tier"] == "MODERATE")
    low_count = sum(1 for z in ranked_zones if z["tier"] == "LOW")
    mean_conf = int(round(np.mean([z["confidence"]["percentage"] for z in ranked_zones]))) if ranked_zones else 95
    
    return {
        "status": "success",
        "dataset_metadata": metadata,
        "image_dimensions": {"width": w, "height": h},
        "telemetry": {
            "total_zones_detected": len(ranked_zones),
            "critical_count": critical_count,
            "moderate_count": moderate_count,
            "low_count": low_count,
            "total_change_pct": telemetry_base["total_change_pct"],
            "total_hectares_impacted": telemetry_base["total_hectares_impacted"],
            "mean_confidence_pct": mean_conf
        },
        "heatmap_overlay": heatmap_uri,
        "ranked_zones": ranked_zones
    }
