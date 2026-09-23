"""
EarthGuard AI — Feature 2: Geospatial Coordinates & Proximity Utility
Owned by: MEMBER 2 (Severity-Ranked Prioritization & Geospatial Triage)
"""

import math
from typing import Dict, Any, Tuple

def map_pixel_to_gps(pixel_xy: Tuple[int, int], 
                       base_gps: Dict[str, float], 
                       img_dims: Tuple[int, int] = (800, 800)) -> Dict[str, float]:
    """
    Simulates high-precision georeferencing converting image pixel coordinates
    to true latitude and longitude coordinates based on the dataset bounding box.
    """
    px, py = pixel_xy
    w, h = img_dims
    lat = base_gps.get("lat", 0.0)
    lon = base_gps.get("lon", 0.0)
    
    # Approx 10m/pixel scale in decimal degrees
    d_lat = (py - (h / 2.0)) * -0.00009
    d_lon = (px - (w / 2.0)) * 0.00012
    
    return {
        "lat": round(lat + d_lat, 6),
        "lon": round(lon + d_lon, 6)
    }

def calculate_proximity(bbox: Tuple[int, int, int, int], 
                        settlement: Dict[str, Any], 
                        img_w: int, img_h: int) -> Tuple[float, float]:
    """
    Calculates distance from zone centroid to the nearest human community buffer.
    Returns (proximity_score 0-1, distance_pixels).
    """
    x, y, w, h = bbox
    cx = x + w / 2.0
    cy = y + h / 2.0
    
    if settlement and "x" in settlement and "y" in settlement:
        sx = float(settlement["x"])
        sy = float(settlement["y"])
        s_radius = float(settlement.get("radius", 80))
    else:
        sx = img_w / 2.0
        sy = img_h / 2.0
        s_radius = 80.0
        
    dx = cx - sx
    dy = cy - sy
    dist = math.sqrt(dx * dx + dy * dy)
    
    if dist <= s_radius:
        prox_score = 1.0
    elif dist <= s_radius * 2.5:
        prox_score = 0.85 - (dist - s_radius) / (s_radius * 3.0)
    else:
        max_dist = math.sqrt(img_w * img_w + img_h * img_h)
        prox_score = max(0.05, 1.0 - (dist / (max_dist * 0.75)))
        
    return round(float(prox_score), 3), round(dist, 1)
