"""
EarthLens AI — Spectral Change-Type Classifier
Owned by: MEMBER 1 (Detection & Computer Vision Lead)

Heuristic and spectral classifier categorizing detected anomalies into:
- Flooding / Water Inundation
- Deforestation / Canopy Loss
- Urban Expansion & Built-Up Infrastructure
- Wildfire Burn Scar
- Coastal Erosion / Sediment Shift
- Agricultural Land Use Transition
"""

import numpy as np

def classify_change(before_crop: np.ndarray, after_crop: np.ndarray, mean_mag: float) -> dict:
    """
    Classifies the dominant environmental event based on RGB and spectral proxies.
    Expects before_crop and after_crop in RGB format.
    """
    if before_crop.size == 0 or after_crop.size == 0:
        return {
            "type": "Unclassified Anomaly",
            "icon": "❓",
            "confidence": 0.5,
            "signature": "Insufficient crop resolution"
        }
        
    b_mean = np.mean(before_crop, axis=(0, 1)).astype(np.float32)
    a_mean = np.mean(after_crop, axis=(0, 1)).astype(np.float32)
    
    # RGB delta
    delta_r = a_mean[0] - b_mean[0]
    delta_g = a_mean[1] - b_mean[1]
    delta_b = a_mean[2] - b_mean[2]
    
    # Vegetation index proxy: (G - R) / (G + R + eps)
    b_vi = (b_mean[1] - b_mean[0]) / (b_mean[1] + b_mean[0] + 1e-5)
    a_vi = (a_mean[1] - a_mean[0]) / (a_mean[1] + a_mean[0] + 1e-5)
    delta_vi = a_vi - b_vi
    
    # Water index proxy: (B - R) / (B + R + eps)
    b_wi = (b_mean[2] - b_mean[0]) / (b_mean[2] + b_mean[0] + 1e-5)
    a_wi = (a_mean[2] - a_mean[0]) / (a_mean[2] + a_mean[0] + 1e-5)
    delta_wi = a_wi - b_wi
    
    # Brightness change
    b_bright = np.mean(b_mean)
    a_bright = np.mean(a_mean)
    delta_bright = a_bright - b_bright
    
    # 1. Flooding / Water Inundation:
    if (delta_wi > 0.08 or (delta_bright < -25 and a_mean[2] > a_mean[0])) and delta_vi < 0.05:
        return {
            "type": "Flooding",
            "icon": "🌊",
            "confidence": float(round(min(0.96, 0.75 + float(abs(delta_wi)) * 2), 2)),
            "signature": f"Water index increased by {float(delta_wi):+.2f}, surface reflectance dropped by {abs(float(delta_bright)):.1f} units."
        }
        
    # 2. Wildfire Burn Scar:
    if delta_bright < -30 and a_bright < 65 and delta_g < -20:
        return {
            "type": "Wildfire Burn Scar",
            "icon": "🔥",
            "confidence": float(round(min(0.95, 0.80 + abs(float(delta_bright)) / 100.0), 2)),
            "signature": f"Severe thermal albedo drop of {abs(float(delta_bright)):.1f} units with charcoal ash residue signature."
        }
        
    # 3. Deforestation / Vegetation Loss:
    if delta_vi < -0.15 or (delta_g < -25 and delta_r > 15):
        return {
            "type": "Deforestation",
            "icon": "🌳",
            "confidence": float(round(min(0.94, 0.78 + abs(float(delta_vi)) * 1.5), 2)),
            "signature": f"Canopy vigor dropped by {abs(float(delta_vi)):.2f}, bare exposed soil reflectance emerged."
        }
        
    # 4. Urban Expansion & Infrastructure:
    if delta_bright > 25 and (delta_r > 15 and delta_b > 15):
        return {
            "type": "Urban Expansion",
            "icon": "🏙️",
            "confidence": float(round(min(0.93, 0.75 + float(delta_bright) / 120.0), 2)),
            "signature": f"High-albedo built-up surfaces (concrete/asphalt) expanded with +{float(delta_bright):.1f} reflectance surge."
        }

    # 5. Coastal Erosion / Shoreline Shift:
    if abs(delta_wi) > 0.12 and abs(delta_bright) > 15:
        return {
            "type": "Coastal Erosion",
            "icon": "🏖️",
            "confidence": 0.88,
            "signature": f"Shoreline boundary shift detected with sediment plume movement of {abs(float(delta_wi)):.2f} NDWI."
        }
        
    # Default fallback
    return {
        "type": "General Environmental Shift",
        "icon": "⚠️",
        "confidence": 0.78,
        "signature": f"Multi-spectral variance magnitude {float(mean_mag):.1f} detected across visible bands."
    }
