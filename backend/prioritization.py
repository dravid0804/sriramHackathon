"""
EarthGuard AI — Severity-Ranked Prioritization Engine (Novelty Feature 1)
Ranks detected change zones by urgency using an explainable, multi-factor formula.
Factors:
1. Change Magnitude (normalized 0-1)
2. Proximity to Settlement / Critical Infrastructure (normalized 0-1, 1 = immediate boundary)
3. Contiguous Region Size / Area in Hectares (larger contiguous change = higher priority)
4. Event Hazard Weight (e.g. Flooding cutting through populated zone vs remote brush)

Categorizes into:
- CRITICAL (Score >= 65): Immediate threat, swift response required
- MODERATE (Score 38 - 64.9): Significant environmental shift, monitor/schedule survey
- LOW (Score < 38): Minor localized disturbance, low-priority monitoring
"""

import math
from typing import List, Dict, Any, Tuple

def calculate_proximity_score(bbox: Tuple[int, int, int, int], 
                              settlement: Dict[str, Any], 
                              img_w: int, img_h: int) -> Tuple[float, float]:
    """
    Computes distance in pixels between zone center and settlement/infrastructure center.
    Returns (proximity_score 0-1, distance_pixels).
    """
    x, y, w, h = bbox
    zone_cx = x + w / 2.0
    zone_cy = y + h / 2.0
    
    if settlement and "x" in settlement and "y" in settlement:
        settle_x = float(settlement["x"])
        settle_y = float(settlement["y"])
        settle_radius = float(settlement.get("radius", 80))
    else:
        settle_x = img_w / 2.0
        settle_y = img_h / 2.0
        settle_radius = 80.0
        
    dx = zone_cx - settle_x
    dy = zone_cy - settle_y
    dist = math.sqrt(dx * dx + dy * dy)
    
    # Distance relative to settlement buffer
    # If inside settlement perimeter or within 1.5x radius: maximum proximity 1.0
    if dist <= settle_radius:
        proximity_score = 1.0
    elif dist <= settle_radius * 2.5:
        proximity_score = 0.85 - (dist - settle_radius) / (settle_radius * 3.0)
    else:
        max_dist = math.sqrt(img_w * img_w + img_h * img_h)
        proximity_score = max(0.05, 1.0 - (dist / (max_dist * 0.75)))
        
    return round(float(proximity_score), 3), round(dist, 1)

def compute_urgency(region_data: Dict[str, Any], 
                    settlement: Dict[str, Any], 
                    img_w: int, img_h: int) -> Dict[str, Any]:
    """
    Computes the composite Urgency Score (0 - 100) and assigns triage tier.
    """
    # 1. Change magnitude (0.0 to 1.0)
    mag = float(region_data.get("mean_magnitude", 0.5))
    norm_mag = min(1.0, max(0.1, mag))
    
    # 2. Proximity to human settlement / critical asset
    bbox = region_data.get("bbox", (0, 0, 10, 10))
    prox_score, dist_px = calculate_proximity_score(bbox, settlement, img_w, img_h)
    
    # 3. Contiguous Area Score
    # Convert pixels to estimated hectares (assuming ~10m resolution: 1 px = 0.01 ha)
    pixel_area = float(region_data.get("pixel_area", 500))
    hectares = round(pixel_area * 0.01, 2)
    
    # Area normalization using soft logarithmic saturation
    area_score = min(1.0, max(0.1, math.log10(max(10.0, pixel_area)) / 4.0))
    
    # 4. Hazard weight multiplier based on change type
    change_type = region_data.get("classification", {}).get("type", "Environmental Shift")
    hazard_multiplier = 1.0
    if "Flooding" in change_type:
        hazard_multiplier = 1.20
    elif "Wildfire" in change_type:
        hazard_multiplier = 1.18
    elif "Deforestation" in change_type:
        hazard_multiplier = 1.10

    # Explainable Weighted Composite Formula:
    # 35% Magnitude + 40% Proximity to Communities + 25% Contiguous Size
    weighted_sum = (0.35 * norm_mag + 0.40 * prox_score + 0.25 * area_score) * 100.0
    final_score = min(99.0, max(10.0, weighted_sum * hazard_multiplier))
    final_score = round(final_score, 1)
    
    # Triage Tier Assignment
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
        
    return {
        "urgency_score": final_score,
        "tier": tier,
        "tier_color": tier_color,
        "tier_label": tier_label,
        "hectares": hectares,
        "distance_to_settlement_px": dist_px,
        "breakdown": {
            "magnitude_factor": round(norm_mag * 100, 1),
            "proximity_factor": round(prox_score * 100, 1),
            "area_factor": round(area_score * 100, 1),
            "hazard_weight": hazard_multiplier
        }
    }

def rank_regions(regions: List[Dict[str, Any]], 
                 settlement: Dict[str, Any], 
                 img_w: int, img_h: int) -> List[Dict[str, Any]]:
    """
    Ranks all detected regions descending by urgency score and tags their ranking index.
    """
    for region in regions:
        urgency_info = compute_urgency(region, settlement, img_w, img_h)
        region.update(urgency_info)
        
    # Sort descending: highest urgency first
    sorted_regions = sorted(regions, key=lambda r: r["urgency_score"], reverse=True)
    
    # Assign rank number
    for idx, r in enumerate(sorted_regions, start=1):
        r["rank"] = idx
        r["zone_id"] = f"ZONE-{idx:02d}"
        
    return sorted_regions
