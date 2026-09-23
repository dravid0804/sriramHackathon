"""
EarthLens AI — Feature Domain 1: Multispectral Index Math
Owned by: MEMBER 1 (Detection & Computer Vision Lead)

Computes satellite index proxies:
- NDVI: Normalized Difference Vegetation Index (Canopy vigor & deforestation)
- NDWI: Normalized Difference Water Index (Flood inundation & water bodies)
- NBR:  Normalized Burn Ratio (Wildfire thermal burn scars)
- NDBI: Normalized Difference Built-Up Index (Urban concrete / asphalt vs soil)
- BSI:  Bare Soil Index (Exposed topsoil & commercial logging paths)
"""

import numpy as np
from typing import Dict

def compute_spectral_indices(rgb_img: np.ndarray) -> Dict[str, np.ndarray]:
    """
    Computes calibrated multispectral index proxies from visible/near-visible RGB bands.
    Expects rgb_img in RGB order [H, W, 3] with values in range [0, 255].
    """
    img_f = rgb_img.astype(np.float32) / 255.0
    r = img_f[:, :, 0]
    g = img_f[:, :, 1]
    b = img_f[:, :, 2]
    
    eps = 1e-6
    
    # 1. NDVI Proxy (Green - Red) / (Green + Red + eps)
    # Scaled to [-1.0, 1.0]
    ndvi = (g - r) / (g + r + eps)
    ndvi = np.clip(ndvi, -1.0, 1.0)
    
    # 2. NDWI Proxy (Blue - Red) / (Blue + Red + eps) or (Green - Red/Blue)
    # High values indicate deep standing water or muddy flood inundation
    ndwi = (b - (r * 0.6 + g * 0.4)) / (b + (r * 0.6 + g * 0.4) + eps)
    ndwi = np.clip(ndwi, -1.0, 1.0)
    
    # 3. NBR Proxy (Normalized Burn Ratio)
    # Ash and charcoal exhibit strong absorption across visible spectra with low albedo
    brightness = (r + g + b) / 3.0
    nbr = (g - (r * 1.2)) / (g + (r * 1.2) + eps)
    nbr = np.clip(nbr, -1.0, 1.0)

    # 4. NDBI Proxy (Built-Up Index for Urban Concrete / High-Albedo Rooftops)
    # Concrete and asphalt reflect evenly with high albedo and low vegetation signature
    ndbi = (brightness - g) / (brightness + g + eps)
    ndbi = np.clip(ndbi, -1.0, 1.0)
    
    # 5. BSI Proxy (Bare Soil Index)
    # Exposed dry soil exhibits higher red/yellow reflection than live canopy
    bsi = ((r + b) - g) / ((r + b) + g + eps)
    bsi = np.clip(bsi, -1.0, 1.0)
    
    return {
        "ndvi": ndvi,
        "ndwi": ndwi,
        "nbr": nbr,
        "ndbi": ndbi,
        "bsi": bsi,
        "brightness": brightness
    }

def compute_spectral_deltas(indices_before: Dict[str, np.ndarray], 
                            indices_after: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
    """
    Computes absolute and signed differences across all spectral channels.
    """
    return {
        "d_ndvi": indices_after["ndvi"] - indices_before["ndvi"],
        "d_ndwi": indices_after["ndwi"] - indices_before["ndwi"],
        "d_nbr": indices_after["nbr"] - indices_before["nbr"],
        "d_ndbi": indices_after["ndbi"] - indices_before["ndbi"],
        "d_bsi": indices_after["bsi"] - indices_before["bsi"],
        "d_brightness": indices_after["brightness"] - indices_before["brightness"]
    }
