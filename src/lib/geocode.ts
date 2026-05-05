// Forward-geocode US zip → { lat, lng } via Nominatim (free tier).
// Cached in localStorage for 24h to honor Nominatim's usage policy and avoid re-geocoding.

type CachedPoint = { lat: number; lng: number; t: number };
const CACHE_KEY = 'zip_geo_cache_v1';
const TTL_MS = 24 * 60 * 60 * 1000;

function readCache(): Record<string, CachedPoint> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CachedPoint>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
}

export async function geocodeZip(
  zip: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!/^\d{5}$/.test(zip)) return null;

  const cache = readCache();
  const hit = cache[zip];
  if (hit && Date.now() - hit.t < TTL_MS) {
    return { lat: hit.lat, lng: hit.lng };
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=us&format=json&limit=1`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!json.length) return null;
    const lat = parseFloat(json[0].lat);
    const lng = parseFloat(json[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    cache[zip] = { lat, lng, t: Date.now() };
    writeCache(cache);
    return { lat, lng };
  } catch {
    return null;
  }
}
