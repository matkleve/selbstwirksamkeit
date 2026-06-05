import { getPosition } from '@/lib/geolocation'
import type { Weather } from '@/lib/types'

export const WEATHER_LABELS: Record<Weather, string> = {
  sunny:        'sonnig',
  partly_cloudy:'leicht bewölkt',
  cloudy:       'bewölkt',
  rainy:        'regnerisch',
  snowy:        'schneeig',
  stormy:       'stürmisch',
  foggy:        'neblig',
}

export const WEATHER_EMOJI: Record<Weather, string> = {
  sunny:        '☀️',
  partly_cloudy:'🌤',
  cloudy:       '☁️',
  rainy:        '🌧',
  snowy:        '❄️',
  stormy:       '⛈',
  foggy:        '🌫',
}

function wmoToWeather(code: number): Weather {
  if (code === 0)                       return 'sunny'
  if (code <= 2)                        return 'partly_cloudy'
  if (code === 3)                       return 'cloudy'
  if (code === 45 || code === 48)       return 'foggy'
  if (code >= 51 && code <= 67)        return 'rainy'
  if (code >= 71 && code <= 77)        return 'snowy'
  if (code >= 80 && code <= 82)        return 'rainy'
  if (code === 85 || code === 86)       return 'snowy'
  if (code >= 95)                       return 'stormy'
  return 'cloudy'
}

export async function fetchCurrentWeather(): Promise<Weather | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null
  try {
    const pos = await getPosition()
    const { latitude: lat, longitude: lon } = pos.coords
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code&forecast_days=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json() as { current?: { weather_code?: number } }
    const code = json.current?.weather_code
    if (code === undefined) return null
    return wmoToWeather(code)
  } catch {
    return null
  }
}
