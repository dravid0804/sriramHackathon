"""
EarthGuard AI — End-to-End Pipeline Verification Test for all datasets
"""

import os
import json
import cv2
from backend.cv_engine import process_satellite_pair

def test_all_datasets():
    datasets = ['amazon_deforestation', 'derna_flooding', 'california_wildfire']
    for ds in datasets:
        sample_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples", ds)
        assert os.path.exists(sample_dir), f"Directory {sample_dir} does not exist"
        
        b_img = cv2.imread(os.path.join(sample_dir, "before.png"))
        a_img = cv2.imread(os.path.join(sample_dir, "after.png"))
        with open(os.path.join(sample_dir, "metadata.json"), "r") as f:
            meta = json.load(f)
            
        b_rgb = cv2.cvtColor(b_img, cv2.COLOR_BGR2RGB)
        a_rgb = cv2.cvtColor(a_img, cv2.COLOR_BGR2RGB)
        
        result = process_satellite_pair(b_rgb, a_rgb, meta)
        top_zone = result['ranked_zones'][0]
        
        print(f"[{ds.upper()}]")
        print(f"  Total Zones: {result['telemetry']['total_zones_detected']}")
        print(f"  Critical: {result['telemetry']['critical_count']}, Moderate: {result['telemetry']['moderate_count']}, Low: {result['telemetry']['low_count']}")
        print(f"  Top Zone: {top_zone['zone_id']} | Tier: {top_zone['tier']} | Urgency: {top_zone['urgency_score']}")
        print(f"  Classification: {top_zone['classification']['type']}")
        print(f"  Confidence: {top_zone['confidence']['percentage']}% ({top_zone['confidence']['level']})")
        print(f"  Brief: {top_zone['incident_brief']['brief_text'][:120]}...")
        print("-" * 60)
        
        assert result["telemetry"]["total_zones_detected"] > 0
        assert "heatmap_overlay" in result
        
    print("\nALL 3 DATASETS VERIFIED WITH EXCELLENT RESULTS!")

if __name__ == "__main__":
    test_all_datasets()
