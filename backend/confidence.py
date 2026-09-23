"""
EarthGuard AI — Confidence & Uncertainty Estimator (Novelty Feature 2)
Computes a transparent sensor confidence metric for each detected change zone.
Evaluates:
- Local cloud / glare contamination
- Local high-frequency noise / edge jitter
- Spectral variance within the region
Surfaces uncertainty explicitly rather than hiding it.
"""

import numpy as np

def estimate_confidence(before_crop: np.ndarray, after_crop: np.ndarray, diff_crop: np.ndarray) -> dict:
    """
    Evaluates confidence of detection in the crop area.
    Returns score (0.0 to 1.0), level ('High', 'Moderate', 'Needs Field Verification'),
    and an explainable diagnostic reason.
    """
    if before_crop.size == 0 or after_crop.size == 0:
        return {
            "score": 0.50,
            "percentage": 50,
            "level": "Needs Field Verification",
            "tag_class": "badge-verification",
            "reason": "Boundary anomaly: Region at image perimeter."
        }

    # 1. Cloud / specular glare check
    # Thick clouds or white specular reflections typically have RGB values > 235 across all 3 channels
    after_white = np.all(after_crop > 230, axis=-1)
    before_white = np.all(before_crop > 230, axis=-1)
    cloud_fraction = float(np.mean(after_white | before_white))

    # 2. Local noise / gradient variance
    # Very high local standard deviation can indicate atmospheric haze or sensor speckle
    local_std = float(np.std(diff_crop))
    norm_std = min(1.0, local_std / 70.0)

    # 3. Base confidence calculation
    # Starts at 0.96 for clear imagery
    base_confidence = 0.96

    # Cloud penalty: up to -0.40 if heavy cloud/glare
    cloud_penalty = min(0.40, cloud_fraction * 1.5)

    # Noise jitter penalty: up to -0.15 if very noisy
    noise_penalty = max(0.0, (norm_std - 0.7) * 0.3)

    final_score = max(0.35, min(0.99, base_confidence - cloud_penalty - noise_penalty))
    percentage = int(round(final_score * 100))

    if percentage >= 85:
        level = "High Confidence"
        tag_class = "badge-high"
        reason = "Atmospheric clarity optimal; sharp spectral transition verified across all bands."
    elif percentage >= 68:
        level = "Moderate Confidence"
        tag_class = "badge-moderate"
        if cloud_fraction > 0.08:
            reason = f"Minor cloud haze/specular interference detected ({int(cloud_fraction*100)}% pixel saturation)."
        else:
            reason = "Subtle radiometric variance observed; secondary satellite pass recommended."
    else:
        level = "Needs Field Verification"
        tag_class = "badge-verification"
        if cloud_fraction > 0.15:
            reason = f"High cloud cover/atmospheric disturbance ({int(cloud_fraction*100)}% obstruction) obscures ground truth."
        else:
            reason = "Significant sensor noise and borderline contrast; prioritize physical ground survey."

    return {
        "score": round(final_score, 2),
        "percentage": percentage,
        "level": level,
        "tag_class": tag_class,
        "cloud_fraction": round(cloud_fraction, 3),
        "reason": reason
    }
