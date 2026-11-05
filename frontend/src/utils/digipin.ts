/**
 * DIGIPIN (Digital Postal Index Number) implementation in TypeScript.
 * Standardized 10-character alphanumeric geo-location code for India.
 * 4x4 hierarchical partitioning of the Indian subcontinent.
 */

const DIGIPIN_ALPHABET = "23456789CFJKMPRT";
const MIN_LAT = 2.5;
const MAX_LAT = 38.5;
const MIN_LON = 65.5;
const MAX_LON = 100.5;

export function encodeDigipin(lat: number, lon: number, precision: number = 10): string {
  const clampedLat = Math.max(MIN_LAT, Math.min(MAX_LAT, Number(lat) || 13.2456));
  const clampedLon = Math.max(MIN_LON, Math.min(MAX_LON, Number(lon) || 77.7123));

  let curMinLat = MIN_LAT;
  let curMaxLat = MAX_LAT;
  let curMinLon = MIN_LON;
  let curMaxLon = MAX_LON;

  const code: string[] = [];

  for (let i = 0; i < precision; i++) {
    const latStep = (curMaxLat - curMinLat) / 4.0;
    const lonStep = (curMaxLon - curMinLon) / 4.0;

    let row = Math.floor((clampedLat - curMinLat) / latStep);
    let col = Math.floor((clampedLon - curMinLon) / lonStep);

    row = Math.min(3, Math.max(0, row));
    col = Math.min(3, Math.max(0, col));

    const index = row * 4 + col;
    code.push(DIGIPIN_ALPHABET[index]);

    curMinLat = curMinLat + row * latStep;
    curMaxLat = curMinLat + latStep;
    curMinLon = curMinLon + col * lonStep;
    curMaxLon = curMinLon + lonStep;
  }

  const raw = code.join('');
  if (raw.length === 10) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
  }
  return raw;
}
