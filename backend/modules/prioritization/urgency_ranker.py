"""
EarthGuard AI — Feature 2: Explainable Severity-Ranked Prioritization
Owned by: MEMBER 2 (Severity-Ranked Prioritization & Geospatial Triage)
"""

import math
from typing import List, Dict, Any
from .geospatial_coords import calculate_proximity, map_pixel_to_gps
from .classifier import classify_change

def compute_zone_urgency(zone: Dict[str, Any], 
                         settlement: Dict[str, Any], 
                         img_w: int, img_h: int, 
                         base_coords: Dict[str, float]) -> Dict[str, Any]:
    """
    Computes explainable composite Urgency Score (0-100) and GPS position.
    """
    mag = float(zone.get("mean_magnitude", 0.5))
    norm_mag = min(1.0, max(0.1, mag))
    
    bbox = zone.get("bbox", [0, 0, 10, 10])
    prox_score, dist_px = calculate_proximity(bbox, settlement, img_w, img_h)
    
    pixel_area = float(zone.get("pixel_area", 500))
    hectares = round(pixel_area * 0.01, 2)
    area_score = min(1.0, max(0.1, math.log10(max(10.0, pixel_area)) / 4.0))
    
    # Classify event
    before_crop = zone.get("before_crop")
    after_crop = zone.get("after_crop")
    cls = classify_change(before_crop, after_crop, mag)
    
    # Hazard multiplier
    hazard_multiplier = 1.0
    c_type = cls.get("type", "")
    if "Flooding" in c_type:
        hazard_multiplier = 1.20
    elif "Wildfire" in c_type:
        hazard_multiplier = 1.18
    elif "Deforestation" in c_type:
        hazard_multiplier = 1.10
        
    # Weighted composite: 35% Magnitude + 40% Community Proximity + 25% Contiguous Size
    weighted_sum = (0.35 * norm_mag + 0.40 * prox_score + 0.25 * area_score) * 100.0
    final_score = min(99.0, max(10.0, weighted_sum * hazard_multiplier))
    final_score = round(final_score, 1)
    
    # Severity Tiers
    if final_score >= 65.0:
        tier = "CRITICAL"
        tier_color = "#ef4444"
        tier_label = "Tier 1: Immediate Field Dispatch"
    elif final_score >= 38.0:
        tier = "MODERATE"
        tier_color = "#f59e0b"
        tier_label = "Tier 2: Priority Surveillance"
    else:
        tier = "LOW"
        tier_color = "#10b981"
        tier_label = "Tier 3: Routine Observation"
        
    gps_loc = map_pixel_to_gps(zone.get("centroid", (400, 400)), base_coords, (img_w, img_h))
    
    return {
        "urgency_score": final_score,
        "tier": tier,
        "tier_color": tier_color,
        "tier_label": tier_label,
        "hectares": hectares,
        "distance_to_settlement_px": dist_px,
        "gps": gps_loc,
        "classification": cls,
        "breakdown": {
            "magnitude_factor": round(norm_mag * 100, 1),
            "proximity_factor": round(prox_score * 100, 1),
            "area_factor": round(area_score * 100, 1),
            "hazard_weight": hazard_multiplier
        }
    }

def rank_and_prioritize_zones(zones: List[Dict[str, Any]], 
                              metadata: Dict[str, Any], 
                              img_w: int, img_h: int) -> List[Dict[str, Any]]:
    """
    Ranks all detected zones strictly descending by urgency.
    """
    settlement = metadata.get("settlement_center", {})
    base_coords = metadata.get("coordinates", {"lat": 0.0, "lon": 0.0})
    
    for zone in zones:
        evaluated = compute_zone_urgency(zone, settlement, img_w, img_h, base_coords)
        zone.update(evaluated)
        
    sorted_zones = sorted(zones, key=lambda z: z["urgency_score"], reverse=True)
    
    for idx, z in enumerate(sorted_zones, start=1):
        z["rank"] = idx
        z["zone_id"] = f"ZONE-{idx:02d}"
        
    return sorted_zones
