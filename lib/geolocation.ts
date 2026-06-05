const NOMINATIM_HEADERS = { 'User-Agent': 'selbstwirksamkeit-app/1.0' }

export function formatGpsAddress(lat: number, lon: number): string {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`
}

export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      maximumAge: 600_000,
    }),
  )
}

function shortPlaceName(displayName: string): string {
  return displayName.split(',')[0]!.trim()
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=de`
    const res = await fetch(url, {
      headers: NOMINATIM_HEADERS,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json() as { display_name?: string }
    return data.display_name?.trim() ?? null
  } catch {
    return null
  }
}

export interface ResolvedGpsLocation {
  label: string
  gps: string
  resolved: string
}

/** GPS coordinates + reverse-geocoded address; null if unavailable or denied. */
export async function resolveLocationFromGps(): Promise<ResolvedGpsLocation | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null
  try {
    const pos = await getPosition()
    const { latitude: lat, longitude: lon } = pos.coords
    const resolved = await reverseGeocode(lat, lon)
    if (!resolved) return null
    return {
      label: shortPlaceName(resolved),
      gps: formatGpsAddress(lat, lon),
      resolved,
    }
  } catch {
    return null
  }
}
