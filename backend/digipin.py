"""
DIGIPIN (Digital Postal Index Number) Implementation for KisanClaim.
Standardized 10-character alphanumeric geo-location code for India.
Based on the national 4x4 hierarchical partitioning of the Indian subcontinent.
Lat: 2.5 to 38.5 N, Lon: 65.5 to 100.5 E.
"""

# 16-character alphabet without confusing characters
DIGIPIN_ALPHABET = "23456789CFJKMPRT"
DIGIPIN_MAP = {char: idx for idx, char in enumerate(DIGIPIN_ALPHABET)}

# India Subcontinent Geodetic Bounding Box
MIN_LAT = 2.5
MAX_LAT = 38.5
MIN_LON = 65.5
MAX_LON = 100.5

def encode_digipin(lat: float, lon: float, precision: int = 10) -> str:
    """
    Encodes GPS (lat, lon) into a DIGIPIN string.
    Returns formatted code e.g. 'KA42-9CF3-8M'
    """
    # Clamp coordinates to bounding box
    clamped_lat = max(MIN_LAT, min(MAX_LAT, float(lat)))
    clamped_lon = max(MIN_LON, min(MAX_LON, float(lon)))

    cur_min_lat = MIN_LAT
    cur_max_lat = MAX_LAT
    cur_min_lon = MIN_LON
    cur_max_lon = MAX_LON

    code = []

    for _ in range(precision):
        lat_step = (cur_max_lat - cur_min_lat) / 4.0
        lon_step = (cur_max_lon - cur_min_lon) / 4.0

        row = int((clamped_lat - cur_min_lat) / lat_step)
        col = int((clamped_lon - cur_min_lon) / lon_step)

        row = min(3, max(0, row))
        col = min(3, max(0, col))

        index = row * 4 + col
        code.append(DIGIPIN_ALPHABET[index])

        cur_min_lat = cur_min_lat + row * lat_step
        cur_max_lat = cur_min_lat + lat_step
        cur_min_lon = cur_min_lon + col * lon_step
        cur_max_lon = cur_min_lon + lon_step

    raw_code = "".join(code)
    # Format as 4-4-2 format e.g. 562C-8F29-KM
    if len(raw_code) == 10:
        return f"{raw_code[:4]}-{raw_code[4:8]}-{raw_code[8:]}"
    return raw_code

def decode_digipin(digipin: str) -> dict:
    """
    Decodes a DIGIPIN string to center (lat, lon) and bounding box.
    """
    clean_code = digipin.replace("-", "").replace(" ", "").upper()
    cur_min_lat = MIN_LAT
    cur_max_lat = MAX_LAT
    cur_min_lon = MIN_LON
    cur_max_lon = MAX_LON

    for char in clean_code:
        if char not in DIGIPIN_MAP:
            continue
        idx = DIGIPIN_MAP[char]
        row = idx // 4
        col = idx % 4

        lat_step = (cur_max_lat - cur_min_lat) / 4.0
        lon_step = (cur_max_lon - cur_min_lon) / 4.0

        cur_min_lat = cur_min_lat + row * lat_step
        cur_max_lat = cur_min_lat + lat_step
        cur_min_lon = cur_min_lon + col * lon_step
        cur_max_lon = cur_min_lon + lon_step

    center_lat = (cur_min_lat + cur_max_lat) / 2.0
    center_lon = (cur_min_lon + cur_max_lon) / 2.0

    return {
        "latitude": round(center_lat, 6),
        "longitude": round(center_lon, 6),
        "bounds": {
            "min_lat": round(cur_min_lat, 6),
            "max_lat": round(cur_max_lat, 6),
            "min_lon": round(cur_min_lon, 6),
            "max_lon": round(cur_max_lon, 6),
        }
    }
