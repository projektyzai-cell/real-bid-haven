// Lightweight Nominatim (OpenStreetMap) helpers — used for street autocomplete
// inside Polish cities, and for reverse-geocoding map clicks.
// Public API, no key required. Caller MUST debounce.

export interface NominatimHit {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    country_code?: string;
  };
}

const BASE = "https://nominatim.openstreetmap.org";

export async function searchStreets(city: string, query: string, signal?: AbortSignal): Promise<string[]> {
  if (!city.trim() || query.trim().length < 2) return [];
  const url = `${BASE}/search?format=json&addressdetails=1&limit=8&accept-language=pl&countrycodes=pl&city=${encodeURIComponent(city)}&street=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimHit[];
  const set = new Set<string>();
  for (const h of data) {
    const road = h.address?.road;
    if (road) set.add(road);
  }
  return Array.from(set);
}

export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<NominatimHit | null> {
  const url = `${BASE}/reverse?format=json&accept-language=pl&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  return (await res.json()) as NominatimHit;
}

// Geocode a "district, city, Polska" query — returns [lat, lng] or null.
export async function geocodeArea(city: string, district: string | undefined, signal?: AbortSignal): Promise<[number, number] | null> {
  if (!city.trim()) return null;
  const q = district?.trim()
    ? `${district}, ${city}, Polska`
    : `${city}, Polska`;
  const url = `${BASE}/search?format=json&limit=1&accept-language=pl&countrycodes=pl&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimHit[];
    if (!data.length) return null;
    return [Number(data[0].lat), Number(data[0].lon)];
  } catch { return null; }
}

