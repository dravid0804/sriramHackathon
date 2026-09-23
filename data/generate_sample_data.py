"""
EarthGuard AI — Satellite Demo Data Generator
Synthesizes high-fidelity multispectral/RGB satellite image pairs for:
1. Amazon Rainforest Deforestation (Rondônia, Brazil)
2. Coastal & Riverine Flash Flooding (Derna, Libya)
3. Foothills Wildfire Burn Scar (California, USA)

Each dataset includes metadata with GPS coordinates, settlement zones,
temporal dates, and baseline descriptions.
"""

import os
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "samples")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_noise(width, height, scale=20, octaves=3):
    """Generates smooth fractal-like Perlin-style noise for natural terrain."""
    base = np.zeros((height, width), dtype=np.float32)
    for i in range(octaves):
        freq = 2 ** i
        amp = 1.0 / freq
        small_w = max(4, width // (scale // freq))
        small_h = max(4, height // (scale // freq))
        rand_grid = np.random.uniform(0, 1, (small_h, small_w)).astype(np.float32)
        im = Image.fromarray(rand_grid).resize((width, height), Image.Resampling.BILINEAR)
        base += np.array(im) * amp
    base = (base - base.min()) / (base.max() - base.min() + 1e-6)
    return base

def generate_amazon_dataset():
    """Generates Amazon Deforestation Before/After pair."""
    w, h = 800, 800
    folder = os.path.join(OUTPUT_DIR, "amazon_deforestation")
    os.makedirs(folder, exist_ok=True)
    
    # 1. Base forest texture (Before)
    noise = create_noise(w, h, scale=16, octaves=4)
    # Deep lush forest green (RGB: [25, 85, 30] to [40, 120, 50])
    forest_r = (20 + noise * 25).astype(np.uint8)
    forest_g = (75 + noise * 60).astype(np.uint8)
    forest_b = (25 + noise * 25).astype(np.uint8)
    
    before_img = np.stack([forest_r, forest_g, forest_b], axis=-1)
    
    # Add winding natural river
    river_mask = np.zeros((h, w), dtype=np.uint8)
    curve_points = []
    for y in range(0, h, 10):
        x = int(w * 0.25 + np.sin(y / 60.0) * 45 + np.cos(y / 150.0) * 30)
        curve_points.append((x, y))
    
    pil_mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(pil_mask)
    for i in range(len(curve_points) - 1):
        draw.line([curve_points[i], curve_points[i+1]], fill=255, width=16)
    river_arr = np.array(pil_mask.filter(ImageFilter.GaussianBlur(1.5))) > 50
    
    # Water color: dark blue-green
    before_img[river_arr] = [28, 55, 75]
    
    # Add a settlement / indigenous village at top-right
    # Settlement coordinates: (620, 180)
    for _ in range(35):
        sx = np.random.randint(580, 680)
        sy = np.random.randint(140, 240)
        sw, sh = np.random.randint(6, 12), np.random.randint(6, 12)
        before_img[sy:sy+sh, sx:sx+sw] = [170, 155, 140] # building roofs
    
    # Save Before
    Image.fromarray(before_img).save(os.path.join(folder, "before.png"))
    
    # 2. Deforested terrain (After)
    after_img = before_img.copy()
    
    # Fishbone logging scars & clearings
    # Zone 1 (Critical): High magnitude cut very close to settlement (x: 520-650, y: 220-400)
    cut1_mask = np.zeros((h, w), dtype=np.uint8)
    c1_draw = ImageDraw.Draw(Image.fromarray(cut1_mask))
    c1_draw.rectangle([510, 240, 670, 390], fill=255)
    c1_draw.polygon([(480, 290), (510, 240), (620, 210), (670, 300), (550, 420)], fill=255)
    
    # Zone 2 (Moderate): Secondary clearing along road (x: 280-450, y: 450-650)
    c1_draw.rectangle([300, 480, 440, 620], fill=255)
    c1_draw.line([(250, 520), (510, 350)], fill=255, width=8) # access road
    
    # Zone 3 (Low): Small clearing far southwest (x: 60-150, y: 650-730)
    c1_draw.rectangle([70, 660, 150, 730], fill=255)
    
    cut_arr = np.array(Image.fromarray(cut1_mask).filter(ImageFilter.GaussianBlur(3)))
    cut_ratio = cut_arr.astype(np.float32) / 255.0
    
    # Soil/clear-cut color: dry tan/orange-brown [165, 125, 80]
    soil_r = (155 + noise * 40).astype(np.uint8)
    soil_g = (115 + noise * 30).astype(np.uint8)
    soil_b = (70 + noise * 25).astype(np.uint8)
    soil_img = np.stack([soil_r, soil_g, soil_b], axis=-1)
    
    for c in range(3):
        after_img[:, :, c] = (after_img[:, :, c] * (1.0 - cut_ratio) + soil_img[:, :, c] * cut_ratio).astype(np.uint8)
    
    # Keep river intact
    after_img[river_arr] = [28, 55, 75]
    
    # Add slight cloud wisps near low-confidence sector (bottom edge)
    cloud_noise = create_noise(w, h, scale=28, octaves=3)
    cloud_mask = (cloud_noise > 0.72).astype(np.float32) * 0.4
    for c in range(3):
        after_img[:, :, c] = (after_img[:, :, c] * (1.0 - cloud_mask) + 240 * cloud_mask).astype(np.uint8)
        
    Image.fromarray(after_img).save(os.path.join(folder, "after.png"))
    
    # Metadata
    metadata = {
        "id": "amazon_deforestation",
        "title": "Amazon Rainforest — Rondônia Fishbone Clearing",
        "location": "Rondônia, Brazil",
        "coordinates": {"lat": -10.8256, "lon": -62.9512, "zoom": 13},
        "sensor": "Sentinel-2 MSI",
        "date_before": "2024-05-14",
        "date_after": "2024-09-22",
        "change_type": "Deforestation",
        "settlement_center": {"x": 630, "y": 190, "name": "Nova Esperança Community", "radius": 70},
        "description": "Rapid commercial timber extraction and slash-and-burn incursions encroaching on native reserve perimeter and agricultural settlement buffer."
    }
    with open(os.path.join(folder, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    print("Created Amazon Deforestation dataset.")

def generate_flooding_dataset():
    """Generates Coastal Flood Inundation Before/After pair."""
    w, h = 800, 800
    folder = os.path.join(OUTPUT_DIR, "derna_flooding")
    os.makedirs(folder, exist_ok=True)
    
    noise = create_noise(w, h, scale=24, octaves=3)
    # Arid coastal Mediterranean landscape: sandy buff/grey-tan
    land_r = (180 + noise * 30).astype(np.uint8)
    land_g = (165 + noise * 25).astype(np.uint8)
    land_b = (140 + noise * 20).astype(np.uint8)
    before_img = np.stack([land_r, land_g, land_b], axis=-1)
    
    # Sea at top 20%
    before_img[:140, :] = [20, 60, 110]
    # Coastline surf
    before_img[138:144, :] = [180, 210, 225]
    
    # Urban blocks (dense coastal city)
    city_draw = ImageDraw.Draw(Image.fromarray(before_img))
    for row in range(160, 680, 35):
        for col in range(100, 700, 45):
            if np.random.rand() > 0.2:
                bw, bh = np.random.randint(18, 32), np.random.randint(16, 26)
                before_img[row:row+bh, col:col+bw] = [210, 205, 195] # rooftops
    
    # Dry river valley (Wadi) cutting vertically
    wadi_mask = np.zeros((h, w), dtype=np.uint8)
    w_draw = ImageDraw.Draw(Image.fromarray(wadi_mask))
    w_draw.line([(400, 140), (410, 300), (390, 500), (420, 800)], fill=255, width=28)
    wadi_arr = np.array(Image.fromarray(wadi_mask).filter(ImageFilter.GaussianBlur(3))) > 60
    before_img[wadi_arr] = [145, 130, 105] # dry silt
    
    Image.fromarray(before_img).save(os.path.join(folder, "before.png"))
    
    # After: Massive catastrophic flood inundation tearing through urban corridor
    after_img = before_img.copy()
    flood_mask = Image.new("L", (w, h), 0)
    f_draw = ImageDraw.Draw(flood_mask)
    # Torrential flood swath expanding from 30px to 160px wide
    flood_poly = [
        (380, 140), (460, 140),
        (510, 320), (550, 480), (500, 650), (490, 800),
        (340, 800), (320, 640), (310, 450), (340, 300)
    ]
    f_draw.polygon(flood_poly, fill=255)
    # Secondary submerged urban sectors
    f_draw.rectangle([480, 340, 620, 490], fill=210)
    f_draw.rectangle([210, 420, 340, 530], fill=180)
    
    flood_smooth = np.array(flood_mask.filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255.0
    
    # Muddy floodwater: turbid deep brown-grey [45, 55, 68]
    flood_r = 45
    flood_g = 60
    flood_b = 75
    
    for c, val in enumerate([flood_r, flood_g, flood_b]):
        after_img[:, :, c] = (after_img[:, :, c] * (1.0 - flood_smooth) + val * flood_smooth).astype(np.uint8)
    
    # Coastal sediment plume spilling into sea
    plume_mask = Image.new("L", (w, h), 0)
    p_draw = ImageDraw.Draw(plume_mask)
    p_draw.ellipse([320, 40, 520, 160], fill=200)
    plume_smooth = np.array(plume_mask.filter(ImageFilter.GaussianBlur(8))).astype(np.float32) / 255.0
    for c, val in enumerate([90, 95, 100]):
        after_img[:140, :, c] = (after_img[:140, :, c] * (1.0 - plume_smooth[:140, :]) + val * plume_smooth[:140, :]).astype(np.uint8)
        
    Image.fromarray(after_img).save(os.path.join(folder, "after.png"))
    
    metadata = {
        "id": "derna_flooding",
        "title": "Mediterranean Coastal Basin — Extreme Flash Inundation",
        "location": "Derna Coastal District, Libya",
        "coordinates": {"lat": 32.7667, "lon": 22.6367, "zoom": 14},
        "sensor": "Sentinel-1 SAR / Sentinel-2 MSI",
        "date_before": "2023-09-08",
        "date_after": "2023-09-13",
        "change_type": "Flooding",
        "settlement_center": {"x": 420, "y": 420, "name": "Central Municipal District", "radius": 180},
        "description": "Catastrophic reservoir breach and intense rainfall storm event washing out primary transit bridges and densely populated residential zones."
    }
    with open(os.path.join(folder, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    print("Created Flooding dataset.")

def generate_wildfire_dataset():
    """Generates California Wildfire Burn Scar Before/After pair."""
    w, h = 800, 800
    folder = os.path.join(OUTPUT_DIR, "california_wildfire")
    os.makedirs(folder, exist_ok=True)
    
    noise = create_noise(w, h, scale=20, octaves=4)
    # Foothill pine and oak woodland: olive-green & dried chaparral
    land_r = (70 + noise * 40).astype(np.uint8)
    land_g = (105 + noise * 35).astype(np.uint8)
    land_b = (50 + noise * 25).astype(np.uint8)
    before_img = np.stack([land_r, land_g, land_b], axis=-1)
    
    # Ridge roads and township settlements
    for y in range(80, 260, 20):
        for x in range(480, 720, 25):
            if np.random.rand() > 0.3:
                before_img[y:y+10, x:x+14] = [185, 175, 160] # roofs
    
    Image.fromarray(before_img).save(os.path.join(folder, "before.png"))
    
    # After: Severe wildfire burn scar with charred charcoal terrain
    after_img = before_img.copy()
    fire_mask = Image.new("L", (w, h), 0)
    f_draw = ImageDraw.Draw(fire_mask)
    
    # Primary massive burn scar
    burn_poly = [
        (220, 180), (380, 120), (520, 190), (620, 310),
        (580, 520), (460, 680), (280, 620), (180, 440)
    ]
    f_draw.polygon(burn_poly, fill=255)
    # Secondary spot fires
    f_draw.ellipse([640, 220, 740, 310], fill=240)
    f_draw.ellipse([120, 550, 220, 660], fill=210)
    
    burn_smooth = np.array(fire_mask.filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255.0
    
    # Burn scar color: charcoal ash black/dark maroon [35, 28, 25]
    char_r = (32 + noise * 15).astype(np.uint8)
    char_g = (25 + noise * 12).astype(np.uint8)
    char_b = (22 + noise * 10).astype(np.uint8)
    char_img = np.stack([char_r, char_g, char_b], axis=-1)
    
    for c in range(3):
        after_img[:, :, c] = (after_img[:, :, c] * (1.0 - burn_smooth) + char_img[:, :, c] * burn_smooth).astype(np.uint8)
        
    Image.fromarray(after_img).save(os.path.join(folder, "after.png"))
    
    metadata = {
        "id": "california_wildfire",
        "title": "Sierra Nevada Foothills — Complex Wildfire Burn Scar",
        "location": "Butte County, California, USA",
        "coordinates": {"lat": 39.7596, "lon": -121.6219, "zoom": 13},
        "sensor": "Sentinel-2 SWIR / Landsat-9 OLI",
        "date_before": "2024-07-10",
        "date_after": "2024-08-04",
        "change_type": "Wildfire Burn Scar",
        "settlement_center": {"x": 600, "y": 180, "name": "Paradise Ridge Township", "radius": 90},
        "description": "Rapidly propagating high-intensity timber canopy blaze with severe thermal burn scar threatening residential wildland-urban interface (WUI)."
    }
    with open(os.path.join(folder, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    print("Created Wildfire dataset.")

def generate_urban_expansion_dataset():
    """Generates Madurai Region Urban Expansion Before/After pair."""
    w, h = 800, 800
    folder = os.path.join(OUTPUT_DIR, "madurai_urban")
    os.makedirs(folder, exist_ok=True)
    
    noise = create_noise(w, h, scale=24, octaves=4)
    # January 2026: Natural agricultural mosaic (paddy green, loam soil, alluvial riverbed)
    land_r = (110 + noise * 25).astype(np.uint8)
    land_g = (135 + noise * 30).astype(np.uint8)
    land_b = (80 + noise * 20).astype(np.uint8)
    before_img = np.stack([land_r, land_g, land_b], axis=-1)
    
    # Natural organic agricultural field patchwork (realistic satellite textures without artificial grid lines)
    np.random.seed(42)
    for py in range(0, h, 75):
        for px in range(0, w, 85):
            pw = np.random.randint(65, 95)
            ph = np.random.randint(60, 85)
            crop_rnd = np.random.rand()
            bh_act = min(ph, h - py)
            bw_act = min(pw, w - px)
            if crop_rnd > 0.60:
                # Irrigated paddy / active vegetation
                before_img[py:py+bh_act, px:px+bw_act, 0] = np.clip(85 + noise[py:py+bh_act, px:px+bw_act] * 20, 0, 255).astype(np.uint8)
                before_img[py:py+bh_act, px:px+bw_act, 1] = np.clip(140 + noise[py:py+bh_act, px:px+bw_act] * 30, 0, 255).astype(np.uint8)
                before_img[py:py+bh_act, px:px+bw_act, 2] = np.clip(65 + noise[py:py+bh_act, px:px+bw_act] * 18, 0, 255).astype(np.uint8)
            elif crop_rnd > 0.30:
                # Alluvial soil / fallow field
                before_img[py:py+bh_act, px:px+bw_act, 0] = np.clip(135 + noise[py:py+bh_act, px:px+bw_act] * 28, 0, 255).astype(np.uint8)
                before_img[py:py+bh_act, px:px+bw_act, 1] = np.clip(120 + noise[py:py+bh_act, px:px+bw_act] * 22, 0, 255).astype(np.uint8)
                before_img[py:py+bh_act, px:px+bw_act, 2] = np.clip(85 + noise[py:py+bh_act, px:px+bw_act] * 18, 0, 255).astype(np.uint8)
        
    # Vaigai Canal waterway winding across
    canal_mask = Image.new("L", (w, h), 0)
    c_draw = ImageDraw.Draw(canal_mask)
    canal_pts = [(0, 480), (200, 460), (420, 510), (600, 490), (800, 530)]
    for i in range(len(canal_pts)-1):
        c_draw.line([canal_pts[i], canal_pts[i+1]], fill=255, width=12)
    canal_arr = np.array(canal_mask.filter(ImageFilter.GaussianBlur(1.0))) > 50
    before_img[canal_arr] = [35, 75, 110]
    
    # Save Before
    Image.fromarray(before_img).save(os.path.join(folder, "before.png"))
    
    # September 2026: Extensive concrete built-up expansion, high albedo rooftops, industrial parks
    after_img = before_img.copy()
    urban_mask = Image.new("L", (w, h), 0)
    u_draw = ImageDraw.Draw(urban_mask)
    
    # Core urban expansion zones (Madurai peri-urban expansion)
    u_draw.rectangle([140, 120, 380, 360], fill=255)
    u_draw.polygon([(360, 220), (540, 160), (620, 340), (440, 420)], fill=240)
    u_draw.rectangle([220, 560, 460, 720], fill=230)
    
    # New multi-lane highway corridor
    u_draw.line([(0, 280), (800, 320)], fill=255, width=14)
    u_draw.line([(320, 0), (360, 800)], fill=255, width=12)
    
    urban_smooth = np.array(urban_mask.filter(ImageFilter.GaussianBlur(3.5))).astype(np.float32) / 255.0
    
    # Urban concrete/asphalt color: high-albedo grey, bluish-white concrete, brick reddish roofs
    built_r = (185 + noise * 45).astype(np.uint8)
    built_g = (185 + noise * 40).astype(np.uint8)
    built_b = (195 + noise * 45).astype(np.uint8)
    built_img = np.stack([built_r, built_g, built_b], axis=-1)
    
    # Add dense building roof textures
    for y in range(130, 350, 16):
        for x in range(150, 370, 18):
            if np.random.rand() > 0.2:
                built_img[y:y+10, x:x+12] = [215, 95, 75] if np.random.rand() > 0.5 else [220, 225, 235]
                
    for c in range(3):
        after_img[:, :, c] = (after_img[:, :, c] * (1.0 - urban_smooth) + built_img[:, :, c] * urban_smooth).astype(np.uint8)
        
    Image.fromarray(after_img).save(os.path.join(folder, "after.png"))
    
    metadata = {
        "id": "madurai_urban",
        "title": "Madurai Region — Accelerated Peri-Urban & Infrastructure Expansion",
        "location": "Madurai District, Tamil Nadu, India",
        "coordinates": {"lat": 9.9252, "lon": 78.1198, "zoom": 13},
        "sensor": "Sentinel-2 MSI / Landsat-9 OLI",
        "date_before": "2026-01-15",
        "date_after": "2026-09-18",
        "change_type": "Urban Expansion",
        "settlement_center": {"x": 300, "y": 280, "name": "Madurai Peri-Urban Growth Corridor", "radius": 140},
        "description": "Rapid conversion of agricultural wetlands and scrub vegetation into high-density commercial infrastructure, bypass expressway corridors, and residential layout tracts."
    }
    with open(os.path.join(folder, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    print("Created Madurai Urban Expansion dataset.")

if __name__ == "__main__":
    generate_amazon_dataset()
    generate_flooding_dataset()
    generate_wildfire_dataset()
    generate_urban_expansion_dataset()
    print("All sample datasets successfully generated.")

