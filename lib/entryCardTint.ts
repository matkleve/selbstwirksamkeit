import { bilinearColor } from '@/lib/gridZones'
import { getValenceColor } from '@/lib/types'
import type { Entry } from '@/lib/types'

export function entryCorrelationRgb(entry: Entry): [number, number, number] | null {
  if (entry.grid_x !== null && entry.grid_y !== null) {
    return bilinearColor(entry.grid_x, entry.grid_y)
  }
  return null
}

/** Accent for rails, dots, borders — full grid when possible, else valence-only */
export function entryCorrelationColor(entry: Entry): string {
  const rgb = entryCorrelationRgb(entry)
  if (rgb) {
    const [r, g, b] = rgb
    return `rgb(${r}, ${g}, ${b})`
  }
  return getValenceColor(entry.grid_x)
}

const BG_MIX_VALENCE = 12
const BG_MIX_GRID = 16
const BORDER_MIX_VALENCE = 42
const BORDER_MIX_GRID = 48

export function entryCardBackground(entry: Entry): string {
  const rgb = entryCorrelationRgb(entry)
  if (!rgb) {
    return `color-mix(in srgb, ${getValenceColor(entry.grid_x)} ${BG_MIX_VALENCE}%, var(--bg-card))`
  }
  const [r, g, b] = rgb
  return `color-mix(in srgb, rgb(${r} ${g} ${b}) ${BG_MIX_GRID}%, var(--bg-card))`
}

export function entryCardBorderColor(entry: Entry): string {
  const rgb = entryCorrelationRgb(entry)
  if (!rgb) {
    return `color-mix(in srgb, ${getValenceColor(entry.grid_x)} ${BORDER_MIX_VALENCE}%, var(--border))`
  }
  const [r, g, b] = rgb
  return `color-mix(in srgb, rgb(${r} ${g} ${b}) ${BORDER_MIX_GRID}%, var(--border))`
}
