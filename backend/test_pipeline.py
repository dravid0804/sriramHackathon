"""
EarthLens AI — End-to-End Pipeline & Geospatial Intelligence Verification Test
Tests all 4 demo datasets (Flooding, Deforestation, Urban Expansion, Wildfire),
community impact calculations, historical surveillance timeline, and grounded AI assistant.
"""

import os
import json
import cv2
from backend.cv_engine import process_satellite_pair
from backend.modules.impact.community_engine import analyze_community_impact
from backend.modules.historical.timeline_engine import get_historical_timeline_data
from backend.modules.assistant.query_engine import answer_investigation_query

def test_all_datasets():
    datasets = ['derna_flooding', 'amazon_deforestation', 'madurai_urban', 'california_wildfire']
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
        assert result["telemetry"]["total_zones_detected"] > 0
        top_zone = result['ranked_zones'][0]
        
        # Test Community Impact calculation
        impact = analyze_community_impact(ds, result['ranked_zones'], meta)
        summary = impact['community_impact_summary']
        assert summary['settlements_count'] > 0
        assert summary['schools_count'] >= 0
        assert summary['hospitals_count'] >= 0
        
        # Test AI assistant query
        ai_ans = answer_investigation_query("What changed here?", {"metadata": meta, "ranked_zones": result['ranked_zones'], "telemetry": result['telemetry']}, impact)
        assert ai_ans['grounded'] is True
        
        print(f"[{ds.upper()}]")
        print(f"  Hazard: {meta.get('change_type')}")
        print(f"  Zones: {result['telemetry']['total_zones_detected']} | Top Tier: {top_zone['tier']} (Score {top_zone['urgency_score']})")
        print(f"  Impact: {summary['settlements_count']} settlements, {summary['schools_count']} schools, {summary['hospitals_count']} hospitals ({summary['vulnerability_tier']} Vuln)")
        print(f"  AI Grounded Answer: {ai_ans['response'][:110]}...")
        print("-" * 70)
        
    # Test Historical timeline
    hist = get_historical_timeline_data()
    assert len(hist['years']) == 3
    assert len(hist['hotspots']) == 4
    print("\n[HISTORICAL SURVEILLANCE & HOTSPOTS]")
    print(f"  Years tracked: {hist['years']}")
    print(f"  Hotspot clusters: {[h['name'] for h in hist['hotspots']]}")
    
    print("\nALL 4 DATASETS & EARTHLENS MODULES VERIFIED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_all_datasets()
