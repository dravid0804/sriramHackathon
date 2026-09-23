"""
EarthLens AI — Feature Domain 1: Computer Vision & Differencing Engine
Owned by: MEMBER 1 (Detection & Computer Vision Lead)

Features:
- Edge-preserving bilateral filtering to suppress atmospheric cloud turbulence
- Multispectral delta fusion (NDVI, NDWI, NBR, NDBI, BSI)
- Adaptive Otsu thresholding with dynamic noise floor
- Morphological closing & opening to consolidate contiguous anomaly tracts
- Douglas-Peucker polygon approximation (cv2.approxPolyDP) for crisp map vectors
- Integrated classification of anomaly type & confidence
"""

import cv2
import numpy as np
import base64
from typing import Dict, Any, List, Tuple
from .spectral_indices import compute_spectral_indices, compute_spectral_deltas
from .classifier import classify_change

def generate_heatmap_overlay(diff_gray: np.ndarray, thresh_mask: np.ndarray) -> str:
    """
    Creates an RGBA heatmap data URI representing change intensity.
    Uses the perceptual Turbo colormap only on verified changed pixels.
    """
    norm_diff = cv2.normalize(diff_gray, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    color_map = cv2.applyColorMap(norm_diff, cv2.COLORMAP_TURBO)
    color_map_rgb = cv2.cvtColor(color_map, cv2.COLOR_BGR2RGB)
    
    alpha = np.zeros_like(diff_gray, dtype=np.uint8)
    # 85% opacity on detected changes
    alpha[thresh_mask > 0] = 215
    
    rgba = np.dstack([color_map_rgb, alpha])
    
    _, buffer = cv2.imencode('.png', cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"

def extract_anomaly_contours(before_rgb: np.ndarray, 
                             after_rgb: np.ndarray) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
    """
    Performs precision satellite image differencing and contour extraction.
    Returns:
    - raw_zones: list of zone candidates with geometry, pixel area, classification, and crops.
    - heatmap_data_uri: visual overlay for frontend studio.
    - telemetry: surface delta percentage and impacted hectares.
    """
    h, w, _ = before_rgb.shape
    
    # 1. Spectral Index Computation
    idx_before = compute_spectral_indices(before_rgb)
    idx_after = compute_spectral_indices(after_rgb)
    deltas = compute_spectral_deltas(idx_before, idx_after)
    
    # 2. Edge-Preserving Bilateral Filter
    # Smooths atmospheric noise while retaining sharp building, road, and river edges
    b_filtered = cv2.bilateralFilter(before_rgb, d=7, sigmaColor=45, sigmaSpace=45)
    a_filtered = cv2.bilateralFilter(after_rgb, d=7, sigmaColor=45, sigmaSpace=45)
    
    b_gray = cv2.cvtColor(b_filtered, cv2.COLOR_RGB2GRAY)
    a_gray = cv2.cvtColor(a_filtered, cv2.COLOR_RGB2GRAY)
    
    raw_intensity_diff = cv2.absdiff(b_gray, a_gray)
    
    # 3. Weighted Multispectral Delta Fusion
    # Combines raw luminosity shifts with biophysical indexes
    fused_diff = (
        raw_intensity_diff.astype(np.float32) * 0.40 +
        np.abs(deltas["d_ndvi"]) * 255.0 * 0.25 +
        np.abs(deltas["d_ndwi"]) * 255.0 * 0.15 +
        np.abs(deltas["d_ndbi"]) * 255.0 * 0.10 +
        np.abs(deltas["d_nbr"]) * 255.0 * 0.10
    )
    fused_diff = np.clip(fused_diff, 0, 255).astype(np.uint8)
    
    # 4. Adaptive Thresholding with Otsu & Noise Floor
    otsu_val, _ = cv2.threshold(fused_diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive_thresh = max(28, int(otsu_val * 0.82))
    _, binary_mask = cv2.threshold(fused_diff, adaptive_thresh, 255, cv2.THRESH_BINARY)
    
    # 5. Morphological Consolidation
    # Elliptical closing bridges logging roads and fragmented flood margins;
    # Small opening purges isolated single-pixel sensor noise
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    
    cleaned_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel_close)
    cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel_open)
    
    # 6. Contour Extraction & Polygon Simplification
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    raw_zones = []
    min_pixel_area = 200 # Discard microscopic specks (< 200 px)
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_pixel_area:
            continue
            
        x, y, cw, ch = cv2.boundingRect(cnt)
        
        # Bounding box with safety padding
        pad = 8
        x0 = max(0, x - pad)
        y0 = max(0, y - pad)
        x1 = min(w, x + cw + pad)
        y1 = min(h, y + ch + pad)
        
        before_crop = before_rgb[y0:y1, x0:x1]
        after_crop = after_rgb[y0:y1, x0:x1]
        diff_crop = fused_diff[y0:y1, x0:x1]
        mask_crop = cleaned_mask[y0:y1, x0:x1]
        
        mean_mag = float(np.mean(diff_crop[mask_crop > 0])) / 255.0 if np.any(mask_crop > 0) else float(np.mean(diff_crop)) / 255.0
        mean_mag = round(min(1.0, mean_mag * 1.3), 3)
        
        # Douglas-Peucker Polygon Simplification for crisp map display
        epsilon = 0.015 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        polygon = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
        
        # Centroid computation via image moments
        M = cv2.moments(cnt)
        cx = int(M["m10"] / M["m00"]) if M["m00"] != 0 else x + cw // 2
        cy = int(M["m01"] / M["m00"]) if M["m00"] != 0 else y + ch // 2
        
        # Run event classification directly
        classification = classify_change(before_crop, after_crop, mean_mag)
        
        # Hectare estimation (1 pixel ≈ 100 m² = 0.01 hectares at 10m Sentinel-2 resolution)
        zone_hectares = round(area * 0.01, 2)
        
        zone = {
            "bbox": [int(x), int(y), int(cw), int(ch)],
            "centroid": [cx, cy],
            "polygon": polygon,
            "pixel_area": int(area),
            "hectares": zone_hectares,
            "mean_magnitude": mean_mag,
            "classification": classification,
            "before_crop": before_crop,
            "after_crop": after_crop,
            "diff_crop": diff_crop
        }
        raw_zones.append(zone)
        
    # Sort by pixel area descending, keep top 15 most prominent regions
    raw_zones = sorted(raw_zones, key=lambda r: r["pixel_area"], reverse=True)[:15]
    heatmap_uri = generate_heatmap_overlay(fused_diff, cleaned_mask)
    
    total_change_px = int(np.sum(cleaned_mask > 0))
    total_change_pct = round((total_change_px / (w * h)) * 100.0, 2)
    total_hectares = round(total_change_px * 0.01, 2)
    
    detection_telemetry = {
        "total_change_pct": total_change_pct,
        "total_hectares_impacted": total_hectares,
        "total_zones_isolated": len(raw_zones)
    }
    
    return raw_zones, heatmap_uri, detection_telemetry
