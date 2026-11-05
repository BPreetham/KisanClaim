"""
Geospatial Intelligence Engine for KisanClaim.
Handles:
- Geodesic distance (Haversine)
- Land parcel polygon area calculation (acres)
- NDVI matrix computation and false-color generation
- Sentinel-2 simulated/synthetic imagery generation
- Geo-spatial bounding and overlay transforms
"""

import math
from typing import List, Tuple, Dict, Any

EARTH_RADIUS_METERS = 6378137.0

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS points in meters."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_METERS * c

def calculate_polygon_area_acres(coords: List[List[float]]) -> float:
    """
    Computes area of a polygon defined by [[lat, lon], ...] in acres.
    Uses spherical shoelace approximation.
    """
    if not coords or len(coords) < 3:
        return 2.5  # default fallback

    # Ensure closed polygon
    pts = list(coords)
    if pts[0] != pts[-1]:
        pts.append(pts[0])

    area_sq_meters = 0.0
    for i in range(len(pts) - 1):
        lat1, lon1 = pts[i]
        lat2, lon2 = pts[i + 1]
        
        x1 = math.radians(lon1) * EARTH_RADIUS_METERS * math.cos(math.radians((lat1 + lat2) / 2.0))
        y1 = math.radians(lat1) * EARTH_RADIUS_METERS
        x2 = math.radians(lon2) * EARTH_RADIUS_METERS * math.cos(math.radians((lat1 + lat2) / 2.0))
        y2 = math.radians(lat2) * EARTH_RADIUS_METERS
        
        area_sq_meters += (x1 * y2 - x2 * y1)

    area_sq_meters = abs(area_sq_meters) / 2.0
    # 1 sq meter = 0.000247105 acres
    acres = area_sq_meters * 0.000247105
    return round(max(0.1, acres), 2)

def generate_ndvi_grid(size: int = 12, pre_disaster: bool = True, disaster_type: str = "Flood") -> List[List[float]]:
    """
    Generates a 2D grid of NDVI values representing the land parcel.
    Healthy crop: 0.65 to 0.85
    Damaged (flood/drought/hail): 0.15 to 0.35 in affected sections
    """
    grid = []
    import random
    rng = random.Random(42 if pre_disaster else 99)

    for r in range(size):
        row = []
        for c in range(size):
            if pre_disaster:
                # Healthy lush vegetative crop
                val = 0.70 + 0.12 * math.sin(r * 0.5) * math.cos(c * 0.5) + rng.uniform(-0.03, 0.03)
                val = max(0.60, min(0.88, val))
            else:
                # Post disaster: severe vegetation loss in central/lower flood basin
                dist_to_center = math.sqrt((r - size / 2.0) ** 2 + (c - size / 2.0) ** 2)
                if disaster_type == "Flood":
                    # Submerged core has low/negative vegetation index
                    if dist_to_center < size * 0.42:
                        val = 0.15 + rng.uniform(-0.04, 0.05)  # waterlogged / drowned
                    else:
                        val = 0.35 + rng.uniform(-0.05, 0.08)  # partially degraded
                elif disaster_type == "Drought":
                    val = 0.22 + 0.08 * math.sin(r * 0.3) + rng.uniform(-0.04, 0.04)
                elif disaster_type == "Hailstorm":
                    val = 0.26 + rng.uniform(-0.08, 0.08)
                else: # Pest / other
                    val = 0.29 + rng.uniform(-0.06, 0.06)
                val = max(0.10, min(0.55, val))
            row.append(round(val, 3))
        grid.append(row)
    return grid

def ndvi_to_color_hex(ndvi: float) -> str:
    """Maps NDVI value (-0.2 to +1.0) to Hex color."""
    if ndvi >= 0.70:
        return "#15803d"  # Very Healthy Veg (Dark Green)
    elif ndvi >= 0.55:
        return "#22c55e"  # Moderate Veg (Green)
    elif ndvi >= 0.40:
        return "#84cc16"  # Low-Moderate Veg (Lime)
    elif ndvi >= 0.25:
        return "#eab308"  # Stressed / Senescent (Yellow)
    elif ndvi >= 0.15:
        return "#f97316"  # Bare Soil / Stubble (Orange)
    elif ndvi >= 0.0:
        return "#ef4444"  # Severe Damage / Dying (Red)
    else:
        return "#1d4ed8"  # Water Body / Deep Submersion (Blue)

def generate_default_polygon(center_lat: float = 13.2456, center_lon: float = 77.7123) -> List[List[float]]:
    """Creates a realistic farm parcel polygon around center coords."""
    d_lat = 0.0012
    d_lon = 0.0015
    return [
        [round(center_lat - d_lat, 6), round(center_lon - d_lon, 6)],
        [round(center_lat - d_lat * 0.8, 6), round(center_lon + d_lon * 1.1, 6)],
        [round(center_lat + d_lat * 1.0, 6), round(center_lon + d_lon * 0.9, 6)],
        [round(center_lat + d_lat * 1.2, 6), round(center_lon - d_lon * 0.7, 6)],
        [round(center_lat - d_lat, 6), round(center_lon - d_lon, 6)],
    ]
