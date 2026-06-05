export type BodyState = 'stressed' | 'calm' | 'tired'

export type Weather = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy'

export interface GridPoint {
  x: number   // -5 to +5, valence
  y: number   // -5 to +5, reference (neg = self, pos = others)
}

export interface Entry {
  id: string
  user_id: string
  title: string | null
  text: string
  grid_x: number | null
  grid_y: number | null
  reframe: string | null
  person: string | null
  location: string | null
  location_gps: string | null
  location_resolved: string | null
  activity: string | null
  body_state: BodyState | null
  weather: Weather | null
  created_at: string
}

export const getQuadrant = (e: Entry): 'pos-other' | 'pos-self' | 'neg-other' | 'neg-self' | null => {
  if (e.grid_x === null || e.grid_y === null) return null
  if (e.grid_x >= 0 && e.grid_y >= 0) return 'pos-other'
  if (e.grid_x >= 0 && e.grid_y < 0)  return 'pos-self'
  if (e.grid_x < 0  && e.grid_y >= 0) return 'neg-other'
  return 'neg-self'
}

export const getValenceColor = (x: number | null): string => {
  if (x === null) return 'var(--valence-neutral)'
  if (x >= 3)  return 'var(--valence-pos-strong)'
  if (x >= 1)  return 'var(--valence-pos-mid)'
  if (x >= -1) return 'var(--valence-pos-weak)'
  if (x >= -3) return 'var(--valence-neg-mid)'
  return 'var(--valence-neg-strong)'
}
