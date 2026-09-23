"""
EarthGuard AI — Feature 1: Computer Vision & Differencing Engine
Owned by: MEMBER 1 (Satellite Change Detection & Observation Studio)
"""

import cv2
import numpy as np
import base64
from typing import Dict, Any, List, Tuple
from .spectral_indices import compute_spectral_indices

def generate_heatmap_overlay(diff_gray: np.ndarray, thresh_mask: np.ndarray) -> str:
    """
    Creates an RGBA heatmap data URI representing change intensity.
    Renders with vibrant Turbo colormap only on changed pixels.
    """
    norm_diff = cv2.normalize(diff_gray, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    color_map = cv2.applyColorMap(norm_diff, cv2.COLORMAP_TURBO)
    color_map_rgb = cv2.cvtColor(color_map, cv2.COLOR_BGR2RGB)
    
    alpha = np.zeros_like(diff_gray, dtype=np.uint8)
    alpha[thresh_mask > 0] = 210
    
    rgba = np.dstack([color_map_rgb, alpha])
    
    _, buffer = cv2.imencode('.png', cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"

def extract_anomaly_contours(before_rgb: np.ndarray, after_rgb: np.ndarray) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
    """
    Performs core image differencing and contour extraction.
    Returns:
    - raw_zones: list of zone candidates with geometry, pixel area, and crops.
    - heatmap_data_uri: visual overlay for frontend studio.
    - telemetry: surface delta percentage and impacted hectares.
    """
    h, w, _ = before_rgb.shape
    
    # 1. Spectral Index Computation
    indices_before = compute_spectral_indices(before_rgb)
    indices_after = compute_spectral_indices(after_rgb)
    
    delta_ndvi = np.abs(indices_after["ndvi"] - indices_before["ndvi"])
    delta_ndwi = np.abs(indices_after["ndwi"] - indices_before["ndwi"])
    delta_nbr = np.abs(indices_after["nbr"] - indices_before["nbr"])
    
    # 2. Pixel Intensity Difference
    before_gray = cv2.cvtColor(before_rgb, cv2.COLOR_RGB2GRAY)
    after_gray = cv2.cvtColor(after_rgb, cv2.COLOR_RGB2GRAY)
    
    b_blur = cv2.GaussianBlur(before_gray, (5, 5), 0)
    a_blur = cv2.GaussianBlur(after_gray, (5, 5), 0)
    
    raw_diff = cv2.absdiff(b_blur, a_blur)
    
    # Combine intensity diff with spectral deltas
    combined_diff = (raw_diff.astype(np.float32) * 0.50 + 
                     (delta_ndvi * 255.0) * 0.25 + 
                     (delta_ndwi * 255.0) * 0.15 +
                     (delta_nbr * 255.0) * 0.10)
    combined_diff = np.clip(combined_diff, 0, 255).astype(np.uint8)
    
    # 3. Thresholding & Morphological Consolidation
    otsu_val, _ = cv2.threshold(combined_diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    thresh_val = max(32, int(otsu_val * 0.85))
    _, binary_mask = cv2.threshold(combined_diff, thresh_val, 255, cv2.THRESH_BINARY)
    
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    
    cleaned_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel_close)
    cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel_open)
    
    # 4. Contour Extraction
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    raw_zones = []
    min_pixel_area = 300
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_pixel_area:
            continue
            
        x, y, cw, ch = cv2.boundingRect(cnt)
        
        pad = 6
        x0 = max(0, x - pad)
        y0 = max(0, y - pad)
        x1 = min(w, x + cw + pad)
        y1 = min(h, y + ch + pad)
        
        before_crop = before_rgb[y0:y1, x0:x1]
        after_crop = after_rgb[y0:y1, x0:x1]
        diff_crop = combined_diff[y0:y1, x0:x1]
        mask_crop = cleaned_mask[y0:y1, x0:x1]
        
        mean_mag = float(np.mean(diff_crop[mask_crop > 0])) / 255.0 if np.any(mask_crop > 0) else float(np.mean(diff_crop)) / 255.0
        mean_mag = round(min(1.0, mean_mag * 1.35), 3)
        
        epsilon = 0.012 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        polygon = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
        
        M = cv2.moments(cnt)
        cx = int(M["m10"] / M["m00"]) if M["m00"] != 0 else x + cw // 2
        cy = int(M["m01"] / M["m00"]) if M["m00"] != 0 else y + ch // 2
        
        zone = {
            "bbox": [int(x), int(y), int(cw), int(ch)],
            "centroid": [cx, cy],
            "polygon": polygon,
            "pixel_area": int(area),
            "mean_magnitude": mean_mag,
            "before_crop": before_crop,
            "after_crop": after_crop,
            "diff_crop": diff_crop
        }
        raw_zones.append(zone)
        
    raw_zones = sorted(raw_zones, key=lambda r: r["pixel_area"], reverse=True)[:15]
    heatmap_uri = generate_heatmap_overlay(combined_diff, cleaned_mask)
    
    total_change_px = int(np.sum(cleaned_mask > 0))
    total_change_pct = round((total_change_px / (w * h)) * 100.0, 2)
    total_hectares = round(total_change_px * 0.01, 2)
    
    detection_telemetry = {
        "total_change_pct": total_change_pct,
        "total_hectares_impacted": total_hectares,
        "total_zones_isolated": len(raw_zones)
    }
    
    return raw_zones, heatmap_uri, detection_telemetry
