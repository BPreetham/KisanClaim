"""
High-Resolution Satellite & Aerial Imagery Synthesizer for KisanClaim.
Generates:
1. sentinel_pre.jpg: Sentinel-2 MSI 10m True Color (Pre-disaster, lush canopy, farm cadastral polygon).
2. sentinel_post.jpg: Sentinel-2 MSI 10m True Color (Post-disaster, waterlogging inundation basin, alert border).
3. sentinel_ndvi.jpg: False-color NDVI spectral change heatmap with calibration scale bar.
4. sample_damaged_crop.jpg: Ground camera photo of submerged crop with forensic EXIF overlay.
5. sample_flood_water.jpg: Ground photo of furrow inundation with timestamp.
6. sample_field_overview.jpg: Landscape overview of cadastral parcel.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

def generate_assets():
    w, h = 800, 550

    # ---------------- 1. SENTINEL-2 PRE-DISASTER ----------------
    img_pre = Image.new("RGB", (w, h), color=(38, 70, 35))
    draw_pre = ImageDraw.Draw(img_pre)

    # Base agricultural tapestry (varying crop plots)
    plots = [
        (40, 50, 220, 260, (46, 125, 50)),
        (220, 50, 480, 240, (56, 142, 60)),
        (480, 50, 760, 270, (43, 110, 48)),
        (40, 260, 280, 500, (67, 160, 71)),
        (280, 240, 520, 500, (56, 142, 60)),
        (520, 270, 760, 500, (76, 175, 80))
    ]
    for x1, y1, x2, y2, col in plots:
        draw_pre.rectangle([x1, y1, x2, y2], fill=col, outline=(30, 60, 30), width=2)
        # Furrow texture
        for fy in range(y1 + 10, y2, 14):
            draw_pre.line([(x1 + 4, fy), (x2 - 4, fy)], fill=(col[0] - 8, col[1] - 8, col[2] - 8), width=1)

    # Rural dirt road & irrigation canal
    draw_pre.line([(20, 250), (780, 255)], fill=(160, 130, 90), width=6)
    draw_pre.line([(490, 40), (510, 510)], fill=(70, 130, 180), width=5) # canal

    # Target Parcel Polygon: KA-BLR-1025 (Ravi Kumar - 2.5 ac)
    parcel = [(300, 140), (580, 150), (550, 380), (270, 360)]
    # Lush healthy ragi within parcel
    draw_pre.polygon(parcel, fill=(34, 150, 45))
    # Boundary outline in neon yellow/green with dash effect
    draw_pre.polygon(parcel, outline=(255, 235, 59), width=4)

    # Parcel vertices markers
    for vx, vy in parcel:
        draw_pre.ellipse([vx - 5, vy - 5, vx + 5, vy + 5], fill=(255, 255, 255), outline=(0, 0, 0), width=2)

    # Satellite Telemetry HUD Header
    draw_pre.rectangle([0, 0, w, 40], fill=(15, 23, 42))
    draw_pre.text((16, 12), "🛰️ COPERNICUS SENTINEL-2A MSI | LEVEL-2A BOA REFLECTANCE | B4-B3-B2 TRUE COLOR", fill=(255, 255, 255))
    draw_pre.text((620, 12), "ACQ: 2026-08-14 10:48 IST", fill=(74, 222, 128))

    # Bottom Metadata Overlay
    draw_pre.rectangle([0, h - 50, w, h], fill=(15, 23, 42))
    draw_pre.text((16, h - 38), "TARGET PARCEL: KA-BLR-1025 | SURVEY: 125/2 | AREA: 2.50 AC | DEVANAHALLI, KARNATAKA", fill=(255, 255, 255))
    draw_pre.text((16, h - 22), "MEAN PRE-DISASTER NDVI: 0.74 (LUSH VEGETATION) | LAT: 13.2456 N, LON: 77.7123 E", fill=(255, 235, 59))

    # Scale Bar & North Arrow
    draw_pre.rectangle([w - 140, h - 40, w - 40, h - 36], fill=(255, 255, 255))
    draw_pre.text((w - 110, h - 30), "100 METERS", fill=(200, 200, 200))
    draw_pre.line([(w - 30, 60), (w - 30, 90)], fill=(255, 255, 255), width=2)
    draw_pre.polygon([(w - 30, 50), (w - 35, 62), (w - 25, 62)], fill=(255, 60, 60))
    draw_pre.text((w - 34, 94), "N", fill=(255, 255, 255))

    img_pre.save(os.path.join(STATIC_DIR, "sentinel_pre.jpg"), quality=92)

    # ---------------- 2. SENTINEL-2 POST-DISASTER ----------------
    img_post = Image.new("RGB", (w, h), color=(45, 55, 40))
    draw_post = ImageDraw.Draw(img_post)

    # Degraded agricultural tapestry (flooded muddy patches)
    for x1, y1, x2, y2, col in plots:
        # Wash out / brown / waterlogged tone
        fcol = (col[0] + 40, col[1] - 40, col[2] - 20)
        draw_post.rectangle([x1, y1, x2, y2], fill=fcol, outline=(30, 40, 30), width=2)

    draw_post.line([(20, 250), (780, 255)], fill=(120, 100, 75), width=6)
    draw_post.line([(490, 40), (510, 510)], fill=(40, 80, 120), width=9) # swollen canal

    # Target Parcel Polygon: KA-BLR-1025 with extensive flood submergence
    draw_post.polygon(parcel, fill=(105, 95, 65)) # Muddy degraded soil
    
    # Standing Flood Water Inundation Basin inside the parcel (1.8 ac)
    flood_basin = [(310, 190), (560, 175), (545, 370), (285, 355)]
    draw_post.polygon(flood_basin, fill=(28, 58, 92)) # Deep murky flood water

    # Submersion ripple textures
    for ry in range(200, 360, 16):
        draw_post.arc([320, ry, 530, ry + 20], start=0, end=180, fill=(60, 110, 160), width=1)

    # Boundary outline in ALERT RED
    draw_post.polygon(parcel, outline=(239, 68, 68), width=4)

    # Parcel vertices markers
    for vx, vy in parcel:
        draw_post.ellipse([vx - 5, vy - 5, vx + 5, vy + 5], fill=(239, 68, 68), outline=(255, 255, 255), width=2)

    # Satellite Telemetry HUD Header
    draw_post.rectangle([0, 0, w, 40], fill=(15, 23, 42))
    draw_post.text((16, 12), "🛰️ COPERNICUS SENTINEL-2B MSI | LEVEL-2A BOA REFLECTANCE | DISASTER WATER INGESTION", fill=(255, 255, 255))
    draw_post.text((620, 12), "ACQ: 2026-08-22 10:52 IST", fill=(248, 113, 113))

    # Bottom Metadata Overlay
    draw_post.rectangle([0, h - 50, w, h], fill=(15, 23, 42))
    draw_post.text((16, h - 38), "TARGET PARCEL: KA-BLR-1025 | INUNDATED BASIN: 1.80 AC (72.0%) | NDWI FLOOD INDEX: +0.48", fill=(255, 255, 255))
    draw_post.text((16, h - 22), "MEAN POST-DISASTER NDVI: 0.28 (COLLAPSE -62.16%) | SEVERE CANOPY LOSS VERIFIED", fill=(248, 113, 113))

    # Scale Bar & North Arrow
    draw_post.rectangle([w - 140, h - 40, w - 40, h - 36], fill=(255, 255, 255))
    draw_post.text((w - 110, h - 30), "100 METERS", fill=(200, 200, 200))
    draw_post.line([(w - 30, 60), (w - 30, 90)], fill=(255, 255, 255), width=2)
    draw_post.polygon([(w - 30, 50), (w - 35, 62), (w - 25, 62)], fill=(255, 60, 60))
    draw_post.text((w - 34, 94), "N", fill=(255, 255, 255))

    img_post.save(os.path.join(STATIC_DIR, "sentinel_post.jpg"), quality=92)

    # ---------------- 3. FALSE-COLOR NDVI HEATMAP (sentinel_ndvi.jpg) ----------------
    w_n, h_n = 800, 360
    img_ndvi = Image.new("RGB", (w_n, h_n), color=(15, 23, 42))
    draw_ndvi = ImageDraw.Draw(img_ndvi)

    # Draw Pre NDVI (Left half)
    draw_ndvi.text((60, 20), "PRE-DISASTER NDVI (2026-08-14)", fill=(74, 222, 128))
    for r in range(14):
        for c in range(14):
            x = 60 + c * 20
            y = 50 + r * 18
            val = 0.72 + (math.sin(r * 0.4) * math.cos(c * 0.4) * 0.12)
            # High green
            col = (21, 128, 61) if val > 0.65 else (74, 222, 128)
            draw_ndvi.rectangle([x, y, x + 18, y + 16], fill=col)

    # Draw Post NDVI (Right half)
    draw_ndvi.text((460, 20), "POST-DISASTER NDVI (2026-08-22)", fill=(248, 113, 113))
    for r in range(14):
        for c in range(14):
            x = 460 + c * 20
            y = 50 + r * 18
            # Inundation center
            dist = math.sqrt((r - 7)**2 + (c - 7)**2)
            if dist < 5.5:
                col = (220, 38, 38) # severe damage / red
            elif dist < 8:
                col = (234, 179, 8) # yellow / stressed
            else:
                col = (132, 204, 22) # moderate green
            draw_ndvi.rectangle([x, y, x + 18, y + 16], fill=col)

    # Color Bar Legend at bottom
    draw_ndvi.text((220, 310), "NDVI SCALE:", fill=(255, 255, 255))
    spectrum = [
        ((220, 38, 38), "0.0 - 0.2 (Submerged / Dying)"),
        ((234, 179, 8), "0.2 - 0.4 (Severe Stress)"),
        ((132, 204, 22), "0.4 - 0.6 (Moderate)"),
        ((21, 128, 61), "0.6 - 0.9 (Lush Canopy)")
    ]
    for i, (col, lbl) in enumerate(spectrum):
        bx = 320 + (i % 2) * 230
        by = 310 if i < 2 else 330
        draw_ndvi.rectangle([bx, by, bx + 14, by + 12], fill=col)
        draw_ndvi.text((bx + 20, by), lbl, fill=(200, 200, 200))

    img_ndvi.save(os.path.join(STATIC_DIR, "sentinel_ndvi.jpg"), quality=92)

    # ---------------- 4. FARMER GROUND PHOTOS ----------------
    # Photo 1: Damaged Ragi
    img_crop = Image.new("RGB", (600, 420), color=(85, 75, 50))
    dc = ImageDraw.Draw(img_crop)
    # Stalks knocked over in muddy flood water
    dc.rectangle([0, 180, 600, 420], fill=(45, 60, 65))
    for i in range(25):
        dc.line([(30 + i * 22, 380), (100 + i * 20, 210)], fill=(90, 120, 50), width=7)
        dc.ellipse([90 + i * 20, 200, 110 + i * 20, 220], fill=(130, 90, 40)) # heads submerged
    # Forensic Stamp Card
    dc.rectangle([20, 330, 580, 405], fill=(15, 23, 42))
    dc.text((32, 342), "📸 FARMER EVIDENCE #1: DAMAGED RAGI CANOPY (SUBMERGED & LODGED)", fill=(255, 255, 255))
    dc.text((32, 362), "EXIF TIMESTAMP: 2026-08-20 16:15:22 IST | DEVICE: REDMI NOTE 13 PRO 5G", fill=(200, 200, 200))
    dc.text((32, 382), "GPS: 13.2458 N, 77.7121 E (OFFSET: 32M INSIDE PARCEL) | HASH: SHA256-VFD92", fill=(74, 222, 128))
    img_crop.save(os.path.join(STATIC_DIR, "sample_damaged_crop.jpg"), quality=90)

    # Photo 2: Flood Waterlogging
    img_flood = Image.new("RGB", (600, 420), color=(40, 55, 65))
    df = ImageDraw.Draw(img_flood)
    df.rectangle([0, 80, 600, 420], fill=(35, 55, 75))
    for i in range(12):
        df.arc([30 + i * 50, 120 + (i % 3) * 25, 90 + i * 50, 160 + (i % 3) * 25], start=0, end=180, fill=(70, 105, 135), width=2)
    dc.rectangle([20, 330, 580, 405], fill=(15, 23, 42))
    df.rectangle([20, 330, 580, 405], fill=(15, 23, 42))
    df.text((32, 342), "🌊 FARMER EVIDENCE #2: FURROW INUNDATION & EXTENSIVE RUNOFF", fill=(255, 255, 255))
    df.text((32, 362), "EXIF TIMESTAMP: 2026-08-20 16:22:04 IST | WATER DEPTH: ~1.8 FEET", fill=(200, 200, 200))
    df.text((32, 382), "GPS: 13.2452 N, 77.7126 E (OFFSET: 48M INSIDE PARCEL) | HASH: SHA256-VFD93", fill=(74, 222, 128))
    img_flood.save(os.path.join(STATIC_DIR, "sample_flood_water.jpg"), quality=90)

    # Photo 3: Field Overview
    img_field = Image.new("RGB", (600, 420), color=(125, 185, 220))
    do = ImageDraw.Draw(img_field)
    do.rectangle([0, 140, 600, 420], fill=(70, 85, 55))
    do.polygon([(80, 180), (520, 185), (580, 420), (20, 420)], fill=(50, 68, 75))
    do.rectangle([20, 330, 580, 405], fill=(15, 23, 42))
    do.text((32, 342), "🌱 FARMER EVIDENCE #3: WHOLE PARCEL PERIMETER OVERVIEW", fill=(255, 255, 255))
    do.text((32, 362), "EXIF TIMESTAMP: 2026-08-20 16:28:40 IST | BOUNDARY DEMARCATION CHECK", fill=(200, 200, 200))
    do.text((32, 382), "GPS: 13.2456 N, 77.7123 E (CENTROID 14M) | HASH: SHA256-VFD94", fill=(74, 222, 128))
    img_field.save(os.path.join(STATIC_DIR, "sample_field_overview.jpg"), quality=90)

    print("High-definition satellite and photographic evidence generated successfully.")

if __name__ == "__main__":
    generate_assets()
