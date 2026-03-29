/**
 * Location privacy utilities:
 * - Fuzzy Geolocation: randomize coords within a 200m radius
 * - Geofence Hiding: suppress users within 100m of their Home/Work address
 */

// Haversine distance in meters
export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns true if the user is within 100m of their saved Home or Work address.
 * If no addresses are saved, returns false (never hidden).
 */
export function isNearHomeOrWork(
  lat: number,
  lng: number,
  homeLat: number | null,
  homeLng: number | null,
  workLat: number | null,
  workLng: number | null,
  thresholdMeters = 100
): boolean {
  if (homeLat != null && homeLng != null) {
    if (haversineMeters(lat, lng, homeLat, homeLng) <= thresholdMeters) return true;
  }
  if (workLat != null && workLng != null) {
    if (haversineMeters(lat, lng, workLat, workLng) <= thresholdMeters) return true;
  }
  return false;
}

/**
 * Fuzzy Geolocation — offsets coordinates by a random vector within `radiusMeters`.
 * Never exposes exact GPS. Produces a 200m "presence radius" by default.
 */
export function fuzzyLocation(
  lat: number,
  lng: number,
  radiusMeters = 200
): { lat: number; lng: number } {
  // Random angle and distance (uniform area distribution)
  const angle = Math.random() * 2 * Math.PI;
  const dist = Math.sqrt(Math.random()) * radiusMeters;

  const dLat = dist / 111_320; // 1° lat ≈ 111,320 m
  const dLng = dist / (111_320 * Math.cos((lat * Math.PI) / 180));

  return {
    lat: lat + dLat * Math.sin(angle),
    lng: lng + dLng * Math.cos(angle),
  };
}

/**
 * Snap to a ~200m privacy grid (coarser than the old 100m grid).
 * Used by the heatmap to aggregate without revealing exact locations.
 */
export function snapToPrivacyGrid(lat: number, lng: number): { lat: number; lng: number } {
  const gridSize = 0.002; // ~222m lat, ~170m lng
  return {
    lat: Math.round(lat / gridSize) * gridSize,
    lng: Math.round(lng / gridSize) * gridSize,
  };
}
