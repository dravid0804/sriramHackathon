"""
EarthGuard AI — Feature 1: Multispectral Index Processing
Owned by: MEMBER 1 (Satellite Change Detection & Observation Studio)
"""

import numpy as np
from typing import Dict

def compute_spectral_indices(img_rgb: np.ndarray) -> Dict[str, np.ndarray]:
    """
    Computes spectral index proxies from RGB and simulated multispectral bands:
    - Green-Red Normalized Index (NDVI proxy): (G - R) / (G + R + eps)
    - Blue-Red Normalized Index (NDWI water proxy): (B - R) / (B + R + eps)
    - Normalized Burn Ratio (NBR proxy): (G - (R*0.7 + B*0.3)) / (G + (R*0.7 + B*0.3) + eps)
    """
    r = img_rgb[:, :, 0].astype(np.float32)
    g = img_rgb[:, :, 1].astype(np.float32)
    b = img_rgb[:, :, 2].astype(np.float32)
    
    eps = 1e-5
    ndvi_proxy = (g - r) / (g + r + eps)
    ndwi_proxy = (b - r) / (b + r + eps)
    
    # NBR proxy for burn scars (contrasting chlorophyll green vs ash reflectance)
    soil_ash = r * 0.7 + b * 0.3
    nbr_proxy = (g - soil_ash) / (g + soil_ash + eps)
    
    return {
        "ndvi": ndvi_proxy,
        "ndwi": ndwi_proxy,
        "nbr": nbr_proxy
    }
