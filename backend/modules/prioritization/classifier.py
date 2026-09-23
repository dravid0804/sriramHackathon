"""
EarthGuard AI — Feature 2: Spectral Change-Type Classifier
Owned by: MEMBER 2 (Severity-Ranked Prioritization & Geospatial Triage)
"""

import numpy as np

def classify_change(before_crop: np.ndarray, after_crop: np.ndarray, mean_mag: float) -> dict:
    """
    Classifies the dominant environmental event based on RGB and spectral proxies.
    """
    if before_crop.size == 0 or after_crop.size == 0:
        return {
            "type": "Unclassified Anomaly",
            "icon": "🌐",
            "confidence": 0.5,
            "signature": "Insufficient crop resolution"
        }
        
    b_mean = np.mean(before_crop, axis=(0, 1)).astype(np.float32)
    a_mean = np.mean(after_crop, axis=(0, 1)).astype(np.float32)
    
    delta_r = a_mean[0] - b_mean[0]
    delta_g = a_mean[1] - b_mean[1]
    delta_b = a_mean[2] - b_mean[2]
    
    b_vi = (b_mean[1] - b_mean[0]) / (b_mean[1] + b_mean[0] + 1e-5)
    a_vi = (a_mean[1] - a_mean[0]) / (a_mean[1] + a_mean[0] + 1e-5)
    delta_vi = a_vi - b_vi
    
    b_wi = (b_mean[2] - b_mean[0]) / (b_mean[2] + b_mean[0] + 1e-5)
    a_wi = (a_mean[2] - a_mean[0]) / (a_mean[2] + a_mean[0] + 1e-5)
    delta_wi = a_wi - b_wi
    
    b_bright = np.mean(b_mean)
    a_bright = np.mean(a_mean)
    delta_bright = a_bright - b_bright
    
    # 1. Flooding / Water Inundation
    if (delta_wi > 0.08 or (delta_bright < -25 and a_mean[2] > a_mean[0])) and delta_vi < 0.05:
        return {
            "type": "Flooding / Inundation",
            "icon": "🌊",
            "confidence": min(0.96, 0.75 + abs(delta_wi) * 2),
            "signature": f"Water index surged by {delta_wi:+.2f}; surface reflectance dropped by {abs(delta_bright):.1f} units."
        }
        
    # 2. Wildfire Burn Scar
    if delta_bright < -30 and a_bright < 65 and delta_g < -20:
        return {
            "type": "Wildfire Burn Scar",
            "icon": "🔥",
            "confidence": min(0.98, 0.80 + abs(delta_bright) / 100),
            "signature": f"Severe thermal charring; total surface reflectance dropped by {abs(delta_bright):.1f} with dense charcoal tone."
        }
        
    # 3. Deforestation / Canopy Loss
    if delta_vi < -0.06 or (delta_g < -15 and delta_r > 5):
        return {
            "type": "Deforestation",
            "icon": "🌲",
            "confidence": min(0.95, 0.78 + abs(delta_vi) * 2),
            "signature": f"Vegetation index declined by {abs(delta_vi):.2f}; mineral soil and clear-cut pattern observed."
        }
        
    # 4. Urban Development / Construction
    if delta_bright > 25 and delta_vi < -0.02:
        return {
            "type": "Urban Development",
            "icon": "🏗️",
            "confidence": 0.84,
            "signature": f"High surface albedo surge (+{delta_bright:.1f}) consistent with structural development."
        }
        
    return {
        "type": "Environmental Shift",
        "icon": "🌐",
        "confidence": 0.72,
        "signature": f"Spectral alteration detected across visible bands (delta magnitude: {mean_mag:.2f})."
    }
