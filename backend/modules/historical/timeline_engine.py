"""
EarthLens AI — Historical Timeline & Geographic Hotspots Engine
Owned by: MEMBER 3 (Intelligence Operations, Analytics & Copilot Lead)
Provides temporal multi-year surveillance across 2024, 2025, and 2026.
Powers the Visual Earth Change Investigation Workspace with multi-year
footprint evolutions, change velocities, anomaly detection, and event timelines.
"""

from typing import Dict, List, Any

def get_historical_timeline_data(dataset_id: str = "all") -> Dict[str, Any]:
    """
    Returns multi-year historical surveillance data (2024 -> 2025 -> 2026)
    including computed YoY percentage deltas, footprint expansion trajectories,
    change velocities, historical anomaly flags, and chronological change event milestones.
    """
    timeline_years = ["2024", "2025", "2026"]
    
    # Yearly metrics for Area Over Time with computed Year-over-Year (YoY) deltas
    area_over_time = [
        {
            "year": "2024",
            "total_area_km2": 42.6,
            "yoy_delta_km2": 0.0,
            "yoy_growth_percent": 0.0,
            "flood_km2": 18.2,
            "deforest_km2": 14.5,
            "urban_km2": 6.8,
            "fire_km2": 3.1,
            "dominant_hazard": "Flooding & Inundation"
        },
        {
            "year": "2025",
            "total_area_km2": 68.4,
            "yoy_delta_km2": 25.8,
            "yoy_growth_percent": 60.6,
            "flood_km2": 24.1,
            "deforest_km2": 22.8,
            "urban_km2": 12.3,
            "fire_km2": 9.2,
            "dominant_hazard": "Flooding & Deforestation"
        },
        {
            "year": "2026",
            "total_area_km2": 104.9,
            "yoy_delta_km2": 36.5,
            "yoy_growth_percent": 53.4,
            "flood_km2": 38.6,
            "deforest_km2": 31.4,
            "urban_km2": 19.5,
            "fire_km2": 15.4,
            "dominant_hazard": "Compound Multi-Hazard"
        }
    ]
    
    # Event count distribution and percentage share of total surveyed terrain
    category_distribution = [
        {
            "category": "Flooding / Water Bodies",
            "count": 28,
            "area_km2": 80.9,
            "percentage_share": 37.5,
            "color": "#06b6d4"
        },
        {
            "category": "Deforestation / Clearing",
            "count": 24,
            "area_km2": 68.7,
            "percentage_share": 31.8,
            "color": "#10b981"
        },
        {
            "category": "Urban Expansion",
            "count": 19,
            "area_km2": 38.6,
            "percentage_share": 17.9,
            "color": "#a855f7"
        },
        {
            "category": "Wildfire & Thermal Scars",
            "count": 14,
            "area_km2": 27.7,
            "percentage_share": 12.8,
            "color": "#ef4444"
        }
    ]
    
    # Priority breakdown by year with YoY percentage deltas
    priority_trends = [
        {
            "year": "2024",
            "critical": 6,
            "moderate": 14,
            "low": 18,
            "critical_yoy_growth": 0.0,
            "moderate_yoy_growth": 0.0
        },
        {
            "year": "2025",
            "critical": 11,
            "moderate": 22,
            "low": 25,
            "critical_yoy_growth": 83.3,
            "moderate_yoy_growth": 57.1
        },
        {
            "year": "2026",
            "critical": 19,
            "moderate": 34,
            "low": 32,
            "critical_yoy_growth": 72.7,
            "moderate_yoy_growth": 54.5
        }
    ]
    
    # Granular timeline milestone summaries for the scrubber HUD
    yearly_summaries = {
        "2024": {
            "total_area_km2": 42.6,
            "yoy_growth_percent": 0.0,
            "critical_count": 6,
            "moderate_count": 14,
            "dominant_hazard": "Flooding & Inundation",
            "status_headline": "Baseline observation established across 4 sentinel sectors.",
            "active_hotspot_ids": ["hotspot-alpha", "hotspot-bravo"]
        },
        "2025": {
            "total_area_km2": 68.4,
            "yoy_growth_percent": 60.6,
            "critical_count": 11,
            "moderate_count": 22,
            "dominant_hazard": "Deforestation & Water Inundation",
            "status_headline": "+60.6% surge driven by Amazon logging corridors and Mediterranean storm runoff.",
            "active_hotspot_ids": ["hotspot-alpha", "hotspot-bravo", "hotspot-charlie"]
        },
        "2026": {
            "total_area_km2": 104.9,
            "yoy_growth_percent": 53.4,
            "critical_count": 19,
            "moderate_count": 34,
            "dominant_hazard": "Compound Multi-Hazard & Urban Encroachment",
            "status_headline": "Critical compound hazards observed; 4 active persistent hotspots identified.",
            "active_hotspot_ids": ["hotspot-alpha", "hotspot-bravo", "hotspot-charlie", "hotspot-delta"]
        }
    }
    
    # Geographic Hotspots (Section 13) — Interactive Investigation Objects with Multi-Year Evolution
    hotspots = [
        {
            "id": "hotspot-alpha",
            "name": "Hotspot Alpha - North African Coastal Basin",
            "region": "Derna Coastal District, Libya",
            "coordinates": {"lat": 32.7667, "lon": 22.6367},
            "detected_events": 14,
            "total_area_km2": 38.6,
            "high_priority_events": 6,
            "primary_hazard": "Flash Flood Inundation & Dam Overtopping",
            "trend": "+42% acceleration since 2024",
            "urgency": "CRITICAL",
            "color": "#ef4444",
            "active_since": "2024",
            "linked_dataset": "derna_flooding",
            "sample_before_image": "/samples/derna_flooding/before.png",
            "sample_mid_image": "/samples/derna_flooding/mid.png",
            "sample_after_image": "/samples/derna_flooding/after.png",
            "change_velocity": "Rapid",
            "footprint_expansion_percent": 112.1,
            "footprint_evolution": {
                "2024": {"area_km2": 18.2, "boundary_radius_m": 850, "label": "2024 Baseline Wadi Basin"},
                "2025": {"area_km2": 26.4, "boundary_radius_m": 1250, "label": "2025 Dam Reservoir Surge"},
                "2026": {"area_km2": 38.6, "boundary_radius_m": 1800, "label": "2026 Coastal Inundation Footprint"}
            },
            "historical_anomaly": {
                "detected": True,
                "headline": "[ALERT] HISTORICAL RUNOFF ANOMALY",
                "message": "Current 2026 storm water discharge volume exceeds the 10-year Mediterranean basin baseline by 2.8 standard deviations.",
                "severity": "CRITICAL"
            },
            "image_quality": {
                "cloud_cover_pct": 1.2,
                "quality_rating": "98% (Optimal)",
                "sensor": "Sentinel-1 SAR / Sentinel-2 MSI",
                "uncertainty": "Low (95% Confidence)"
            },
            "historical_community_impact": {
                "2024": {"settlements": 2, "schools": 1, "hospitals": 0, "roads": 2},
                "2025": {"settlements": 4, "schools": 2, "hospitals": 1, "roads": 4},
                "2026": {"settlements": 6, "schools": 3, "hospitals": 1, "roads": 6}
            },
            "critical_infrastructure_risk": "Coastal Road Al-Bahr severed; Derna Central Hospital perimeter exposed within 1.2km.",
            "timeline_events": [
                {
                    "year": "2024",
                    "date": "2024-03-12",
                    "title": "Hydrological Baseline Established",
                    "change_type": "Water Baseline",
                    "area_km2": 18.2,
                    "severity": "LOW",
                    "confidence": 96,
                    "description": "Initial multispectral radar baseline mapped across Wadi Derna riverbed."
                },
                {
                    "year": "2025",
                    "date": "2025-08-20",
                    "title": "Dam Reservoir Siltation & Water Rise",
                    "change_type": "Water Surge",
                    "area_km2": 26.4,
                    "severity": "MODERATE",
                    "confidence": 94,
                    "description": "Upstream reservoir water level increased by 4.2m following seasonal runoff."
                },
                {
                    "year": "2026",
                    "date": "2026-09-13",
                    "title": "Extreme Dam Overtopping & Flash Flood",
                    "change_type": "Flash Flood Inundation",
                    "area_km2": 38.6,
                    "severity": "CRITICAL",
                    "confidence": 95,
                    "description": "Catastrophic breach of secondary earth dam inundates urban residential sectors."
                }
            ]
        },
        {
            "id": "hotspot-bravo",
            "name": "Hotspot Bravo - Southwest Amazon Frontier",
            "region": "Rondônia Logging Arc, Brazil",
            "coordinates": {"lat": -10.8256, "lon": -62.9512},
            "detected_events": 18,
            "total_area_km2": 44.2,
            "high_priority_events": 7,
            "primary_hazard": "Fishbone Deforestation & Indigenous Reserve Incursion",
            "trend": "+29% logging corridor expansion",
            "urgency": "CRITICAL",
            "color": "#ef4444",
            "active_since": "2024",
            "linked_dataset": "amazon_deforestation",
            "sample_before_image": "/samples/amazon_deforestation/before.png",
            "sample_mid_image": "/samples/amazon_deforestation/mid.png",
            "sample_after_image": "/samples/amazon_deforestation/after.png",
            "change_velocity": "Moderate",
            "footprint_expansion_percent": 84.2,
            "footprint_evolution": {
                "2024": {"area_km2": 24.0, "boundary_radius_m": 1100, "label": "2024 Secondary Logging Trails"},
                "2025": {"area_km2": 34.2, "boundary_radius_m": 1500, "label": "2025 Lateral Feeder Corridors"},
                "2026": {"area_km2": 44.2, "boundary_radius_m": 1950, "label": "2026 Deep Reserve Incursion"}
            },
            "historical_anomaly": {
                "detected": True,
                "headline": "[ALERT] CANOPY DEPLETION ANOMALY",
                "message": "Fishbone logging expansion rate into Nova Esperança protected indigenous perimeter is 1.8x the regional seasonal average.",
                "severity": "CRITICAL"
            },
            "image_quality": {
                "cloud_cover_pct": 4.1,
                "quality_rating": "94% (High)",
                "sensor": "Sentinel-2 MSI / Landsat-8/9 OLI",
                "uncertainty": "Low-Moderate (Minor Cloud Filtering Applied)"
            },
            "historical_community_impact": {
                "2024": {"settlements": 1, "schools": 0, "hospitals": 0, "roads": 1},
                "2025": {"settlements": 2, "schools": 1, "hospitals": 0, "roads": 2},
                "2026": {"settlements": 3, "schools": 1, "hospitals": 1, "roads": 3}
            },
            "critical_infrastructure_risk": "BR-364 corridor access; Nova Esperança hamlet perimeter breached within 1.1km.",
            "timeline_events": [
                {
                    "year": "2024",
                    "date": "2024-05-10",
                    "title": "Primary Arterial Clearing",
                    "change_type": "Deforestation",
                    "area_km2": 24.0,
                    "severity": "MODERATE",
                    "confidence": 92,
                    "description": "Initial logging feeder road cut through primary rainforest canopy."
                },
                {
                    "year": "2025",
                    "date": "2025-07-18",
                    "title": "Fishbone Lateral Spoke Network",
                    "change_type": "Clear-cutting",
                    "area_km2": 34.2,
                    "severity": "HIGH",
                    "confidence": 91,
                    "description": "Parallel clearing spokes branch outward perpendicularly along 18km strip."
                },
                {
                    "year": "2026",
                    "date": "2026-08-30",
                    "title": "Indigenous Reserve Buffer Breach",
                    "change_type": "Protected Forest Loss",
                    "area_km2": 44.2,
                    "severity": "CRITICAL",
                    "confidence": 93,
                    "description": "Clear-cut boundary penetrates 1.1km inside the official indigenous conservation territory."
                }
            ]
        },
        {
            "id": "hotspot-charlie",
            "name": "Hotspot Charlie - South Asian Agricultural Transition Zone",
            "region": "Madurai Peri-Urban Corridor, India",
            "coordinates": {"lat": 9.9252, "lon": 78.1198},
            "detected_events": 11,
            "total_area_km2": 21.4,
            "high_priority_events": 3,
            "primary_hazard": "Farmland Conversion & Groundwater Recharge Encroachment",
            "trend": "+35% built-up surface growth",
            "urgency": "MODERATE",
            "color": "#f97316",
            "active_since": "2025",
            "linked_dataset": "madurai_urban",
            "sample_before_image": "/samples/madurai_urban/before.png",
            "sample_mid_image": "/samples/madurai_urban/mid.png",
            "sample_after_image": "/samples/madurai_urban/after.png",
            "change_velocity": "Rapid",
            "footprint_expansion_percent": 96.3,
            "footprint_evolution": {
                "2024": {"area_km2": 10.9, "boundary_radius_m": 700, "label": "2024 Agricultural Baseline"},
                "2025": {"area_km2": 15.8, "boundary_radius_m": 1050, "label": "2025 Outer Ring Bypass Works"},
                "2026": {"area_km2": 21.4, "boundary_radius_m": 1400, "label": "2026 High-Density Commercial Layouts"}
            },
            "historical_anomaly": {
                "detected": True,
                "headline": "[ALERT] URBAN EXPANSION ACCELERATION",
                "message": "Conversion of natural groundwater percolation tanks along NH-44 expanded at 2.4x the regional urban master plan projection.",
                "severity": "MODERATE"
            },
            "image_quality": {
                "cloud_cover_pct": 0.8,
                "quality_rating": "99% (Optimal)",
                "sensor": "Sentinel-2 MSI (10m Optical)",
                "uncertainty": "Low"
            },
            "historical_community_impact": {
                "2024": {"settlements": 2, "schools": 1, "hospitals": 0, "roads": 1},
                "2025": {"settlements": 3, "schools": 2, "hospitals": 1, "roads": 3},
                "2026": {"settlements": 4, "schools": 2, "hospitals": 1, "roads": 5}
            },
            "critical_infrastructure_risk": "Vilangudi-Dindigul bypass construction encroaching on traditional tank beds.",
            "timeline_events": [
                {
                    "year": "2024",
                    "date": "2024-02-15",
                    "title": "Agricultural Baseline Survey",
                    "change_type": "Cropland Baseline",
                    "area_km2": 10.9,
                    "severity": "LOW",
                    "confidence": 95,
                    "description": "High vegetation index (NDVI > 0.6) across traditional paddy and tank catchments."
                },
                {
                    "year": "2025",
                    "date": "2025-06-12",
                    "title": "Groundbreaking of Bypass Transit Corridor",
                    "change_type": "Land Clearing",
                    "area_km2": 15.8,
                    "severity": "MODERATE",
                    "confidence": 92,
                    "description": "Grading and topsoil removal for new four-lane bypass connecting to NH-44."
                },
                {
                    "year": "2026",
                    "date": "2026-09-18",
                    "title": "Dense Peri-Urban Impervious Sprawl",
                    "change_type": "Urban Expansion",
                    "area_km2": 21.4,
                    "severity": "MODERATE",
                    "confidence": 93,
                    "description": "Asphalt and commercial warehousing replace 28% of historical catchment."
                }
            ]
        },
        {
            "id": "hotspot-delta",
            "name": "Hotspot Delta - Sierra Nevada Wildland Interface",
            "region": "Butte County, California, USA",
            "coordinates": {"lat": 39.7596, "lon": -121.6219},
            "detected_events": 9,
            "total_area_km2": 19.8,
            "high_priority_events": 4,
            "primary_hazard": "Thermal Canopy Burn Scars & Smoke Inhalation",
            "trend": "Seasonal summer spike",
            "urgency": "MODERATE",
            "color": "#f97316",
            "active_since": "2026",
            "linked_dataset": "california_wildfire",
            "sample_before_image": "/samples/california_wildfire/before.png",
            "sample_mid_image": "/samples/california_wildfire/mid.png",
            "sample_after_image": "/samples/california_wildfire/after.png",
            "change_velocity": "Rapid",
            "footprint_expansion_percent": 141.5,
            "footprint_evolution": {
                "2024": {"area_km2": 8.2, "boundary_radius_m": 600, "label": "2024 Dry Fuel Accumulation"},
                "2025": {"area_km2": 12.4, "boundary_radius_m": 850, "label": "2025 Ridge Lightning Strike Scar"},
                "2026": {"area_km2": 19.8, "boundary_radius_m": 1300, "label": "2026 Crown Fire & Canyon Run"}
            },
            "historical_anomaly": {
                "detected": True,
                "headline": "[ALERT] THERMAL RADIATIVE POWER SPIKE",
                "message": "MODIS/VIIRS thermal radiative power peaked at 480 MW during high-wind gust alignment, exceeding historical summer fire velocity.",
                "severity": "HIGH"
            },
            "image_quality": {
                "cloud_cover_pct": 2.2,
                "quality_rating": "96% (High)",
                "sensor": "Sentinel-2 MSI / Landsat-9 TIRS",
                "uncertainty": "Low (Minor Smoke Haze Corrected)"
            },
            "historical_community_impact": {
                "2024": {"settlements": 1, "schools": 0, "hospitals": 0, "roads": 1},
                "2025": {"settlements": 1, "schools": 1, "hospitals": 0, "roads": 2},
                "2026": {"settlements": 2, "schools": 1, "hospitals": 1, "roads": 3}
            },
            "critical_infrastructure_risk": "Skyway Ridge evacuation route restricted by heavy smoke plumes.",
            "timeline_events": [
                {
                    "year": "2024",
                    "date": "2024-07-04",
                    "title": "Low-Severity Understory Burn",
                    "change_type": "Brush Fire",
                    "area_km2": 8.2,
                    "severity": "LOW",
                    "confidence": 90,
                    "description": "Contained localized brush fire along east ridge canyon."
                },
                {
                    "year": "2025",
                    "date": "2025-08-11",
                    "title": "Lightning Ignition on Ridge Crest",
                    "change_type": "Thermal Anomaly",
                    "area_km2": 12.4,
                    "severity": "MODERATE",
                    "confidence": 93,
                    "description": "Dry lightning strike establishes moderate burn scar in conifer timber."
                },
                {
                    "year": "2026",
                    "date": "2026-09-08",
                    "title": "High-Wind Crown Fire Flare-Up",
                    "change_type": "Wildfire Burn Scar",
                    "area_km2": 19.8,
                    "severity": "CRITICAL",
                    "confidence": 94,
                    "description": "Wind-driven crown fire crosses Skyway Ridge and threatens wildland-urban interface."
                }
            ]
        }
    ]

    return {
        "years": timeline_years,
        "area_over_time": area_over_time,
        "category_distribution": category_distribution,
        "priority_trends": priority_trends,
        "yearly_summaries": yearly_summaries,
        "hotspots": hotspots,
        "meta": {
            "satellite_sensors": ["Sentinel-2 MSI", "Landsat-8/9 OLI", "Sentinel-1 SAR", "MODIS/VIIRS"],
            "temporal_resolution": "Quarterly composite benchmarks",
            "confidence_standard": "95% statistical confidence interval",
            "yoy_calculation_method": "Compound annual spatial differencing against 2024 baseline",
            "investigation_workspace_version": "3.0.0-prakash"
        }
    }
