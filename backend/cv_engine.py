"""
EarthGuard AI — Computer Vision & Spectral Differencing Engine
Implements:
1. Multispectral and pixel-intensity image differencing.
2. Vegetation (NDVI proxy) and Water (NDWI proxy) difference computation.
3. OpenCV adaptive thresholding, morphological filtering, and contour extraction.
4. Bounding box, polygon contour simplification, and area extraction.
5. Heatmap overlay synthesis (color-coded by change intensity).
6. Integration with Prioritization, Confidence, Classifier, and Briefing modules.
"""

import cv2
import numpy as np
import base64
import os
from typing import Dict, Any, List, Tuple
from PIL import Image

from .classifier import classify_change
from .confidence import estimate_confidence
from .prioritization import rank_regions
from .briefing_engine import generate_incident_brief

def compute_spectral_indices(img_rgb: np.ndarray) -> Dict[str, np.ndarray]:
    """
    Computes spectral index proxies from RGB imagery:
    - Green-Red Normalized Index (NDVI proxy): (G - R) / (G + R + eps)
    - Blue-Red Normalized Index (NDWI/water proxy): (B - R) / (B + R + eps)
    """
    r = img_rgb[:, :, 0].astype(np.float32)
    g = img_rgb[:, :, 1].astype(np.float32)
    b = img_rgb[:, :, 2].astype(np.float32)
    
    eps = 1e-5
    ndvi_proxy = (g - r) / (g + r + eps)
    ndwi_proxy = (b - r) / (b + r + eps)
    
    return {
        "ndvi": ndvi_proxy,
        "ndwi": ndwi_proxy
    }

def generate_heatmap_overlay(diff_gray: np.ndarray, thresh_mask: np.ndarray) -> str:
    """
    Creates a transparent RGBA heatmap data URI representing change intensity.
    Only pixels where change exceeds threshold are rendered with vibrant Turbo/Jet colors.
    """
    norm_diff = cv2.normalize(diff_gray, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    color_map = cv2.applyColorMap(norm_diff, cv2.COLORMAP_TURBO)
    color_map_rgb = cv2.cvtColor(color_map, cv2.COLOR_BGR2RGB)
    
    alpha = np.zeros_like(diff_gray, dtype=np.uint8)
    alpha[thresh_mask > 0] = 210 # Vibrant high-contrast overlay
    
    rgba = np.dstack([color_map_rgb, alpha])
    
    _, buffer = cv2.imencode('.png', cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"

def process_satellite_pair(before_rgb: np.ndarray, 
                           after_rgb: np.ndarray, 
                           metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Executes the end-to-end EarthGuard AI pipeline on a Before & After image pair.
    """
    if metadata is None:
        metadata = {}
        
    h, w, _ = before_rgb.shape
    
    # 1. Spectral Index Computation
    indices_before = compute_spectral_indices(before_rgb)
    indices_after = compute_spectral_indices(after_rgb)
    
    delta_ndvi = np.abs(indices_after["ndvi"] - indices_before["ndvi"])
    delta_ndwi = np.abs(indices_after["ndwi"] - indices_before["ndwi"])
    
    # 2. Pixel Intensity Difference
    before_gray = cv2.cvtColor(before_rgb, cv2.COLOR_RGB2GRAY)
    after_gray = cv2.cvtColor(after_rgb, cv2.COLOR_RGB2GRAY)
    
    b_blur = cv2.GaussianBlur(before_gray, (5, 5), 0)
    a_blur = cv2.GaussianBlur(after_gray, (5, 5), 0)
    
    raw_diff = cv2.absdiff(b_blur, a_blur)
    
    # Combine intensity diff with spectral delta
    combined_diff = (raw_diff.astype(np.float32) * 0.55 + 
                     (delta_ndvi * 255.0) * 0.30 + 
                     (delta_ndwi * 255.0) * 0.15)
    combined_diff = np.clip(combined_diff, 0, 255).astype(np.uint8)
    
    # 3. Thresholding & Morphological Consolidation
    # Otsu threshold + minimum baseline cutoff
    otsu_val, _ = cv2.threshold(combined_diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    thresh_val = max(32, int(otsu_val * 0.85))
    _, binary_mask = cv2.threshold(combined_diff, thresh_val, 255, cv2.THRESH_BINARY)
    
    # Morphological Close with circular kernel to bridge broken cut blocks
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    
    cleaned_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel_close)
    cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel_open)
    
    # 4. Contour Extraction
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # 5. Extract Feature Zones
    raw_regions = []
    min_pixel_area = 300 # Suppress fine sensor noise
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_pixel_area:
            continue
            
        x, y, cw, ch = cv2.boundingRect(cnt)
        
        # Crop region for localized analysis
        pad = 6
        x0 = max(0, x - pad)
        y0 = max(0, y - pad)
        x1 = min(w, x + cw + pad)
        y1 = min(h, y + ch + pad)
        
        before_crop = before_rgb[y0:y1, x0:x1]
        after_crop = after_rgb[y0:y1, x0:x1]
        diff_crop = combined_diff[y0:y1, x0:x1]
        mask_crop = cleaned_mask[y0:y1, x0:x1]
        
        # Mean change magnitude within contour (0.0 to 1.0)
        mean_mag = float(np.mean(diff_crop[mask_crop > 0])) / 255.0 if np.any(mask_crop > 0) else float(np.mean(diff_crop)) / 255.0
        mean_mag = round(min(1.0, mean_mag * 1.35), 3)
        
        # Contour polygon simplification for fast SVG/Leaflet rendering
        epsilon = 0.012 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        polygon = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
        
        # Centroid
        M = cv2.moments(cnt)
        if M["m00"] != 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
        else:
            cx = x + cw // 2
            cy = y + ch // 2
            
        # Classify change type
        classification = classify_change(before_crop, after_crop, mean_mag)
        
        # Estimate confidence & noise
        conf = estimate_confidence(before_crop, after_crop, diff_crop)
        
        region = {
            "bbox": [int(x), int(y), int(cw), int(ch)],
            "centroid": [cx, cy],
            "polygon": polygon,
            "pixel_area": int(area),
            "mean_magnitude": mean_mag,
            "classification": classification,
            "confidence": conf
        }
        raw_regions.append(region)
        
    # Cap to top 15 most prominent zones for clear triage UI
    raw_regions = sorted(raw_regions, key=lambda r: r["pixel_area"], reverse=True)[:15]
    
    # 6. Prioritization & Ranking (Novelty Feature 1)
    settlement = metadata.get("settlement_center", {})
    ranked_zones = rank_regions(raw_regions, settlement, w, h)
    
    # 7. Natural-Language Incident Briefs (Novelty Feature 3)
    for zone in ranked_zones:
        zone["incident_brief"] = generate_incident_brief(zone, metadata)
        
    # 8. Generate Heatmap Overlay
    heatmap_uri = generate_heatmap_overlay(combined_diff, cleaned_mask)
    
    # 9. Compute Global Telemetry
    total_change_px = int(np.sum(cleaned_mask > 0))
    total_change_pct = round((total_change_px / (w * h)) * 100.0, 2)
    total_hectares = round(total_change_px * 0.01, 2)
    
    critical_count = sum(1 for z in ranked_zones if z["tier"] == "CRITICAL")
    moderate_count = sum(1 for z in ranked_zones if z["tier"] == "MODERATE")
    low_count = sum(1 for z in ranked_zones if z["tier"] == "LOW")
    
    return {
        "status": "success",
        "dataset_metadata": metadata,
        "image_dimensions": {"width": w, "height": h},
        "telemetry": {
            "total_zones_detected": len(ranked_zones),
            "critical_count": critical_count,
            "moderate_count": moderate_count,
            "low_count": low_count,
            "total_change_pct": total_change_pct,
            "total_hectares_impacted": total_hectares,
            "mean_confidence_pct": int(round(np.mean([z["confidence"]["percentage"] for z in ranked_zones]))) if ranked_zones else 95
        },
        "heatmap_overlay": heatmap_uri,
        "ranked_zones": ranked_zones
    }
