import type { Entry } from '@/lib/types'
import {
  gridTintAccentColor,
  gridTintBackgroundStyle,
  gridTintBorderStyle,
  gridTintLayers,
  gridTintMix,
  gridTintRgb,
  gridTintShellBackground,
  gridTintBalls,
  gridTintBallGlow,
  gridTintCloudFill,
  gridTintClouds,
  gridTintVeils,
  type GridPosition,
  type GridTintBlob,
  type GridTintLayers,
  type GridTintPreset,
  type GridTintBall,
  type GridTintCloud,
  type GridTintVeil,
} from '@/lib/gridTint'

export type {
  GridPosition,
  GridTintBlob,
  GridTintLayers,
  GridTintPreset,
  GridTintBall,
  GridTintCloud,
  GridTintVeil,
  GridTintVeilId,
}

export {
  gridTintAccentColor,
  gridTintBackgroundStyle,
  gridTintBorderStyle,
  gridTintLayers,
  gridTintMix,
  gridTintRgb,
  gridTintShellBackground,
  gridTintBalls,
  gridTintBallGlow,
  gridTintCloudFill,
  gridTintClouds,
  gridTintVeils,
}

/** @deprecated use gridTintMix */
export const gridTintOnCard = gridTintMix

function entryPreset(compact: boolean): GridTintPreset {
  return compact ? 'card-compact' : 'card'
}

export function entryCorrelationRgb(entry: Entry) {
  return gridTintRgb({ x: entry.grid_x, y: entry.grid_y })
}

export function entryCorrelationColor(entry: Entry): string {
  return gridTintAccentColor({ x: entry.grid_x, y: entry.grid_y })
}

/** @deprecated use `cardBoxShadow` from `@/lib/gridZones` on the shell. */
export function entryCardBackground(_entry: Entry, _compact = false): string {
  return 'var(--bg-card)'
}

/** @deprecated saved cards use compose shadow only — no tinted border. */
export function entryCardBorderColor(_entry: Entry, _compact = false): string {
  return 'var(--border)'
}

/** @deprecated use gridTintLayers */
export function entryCardCloudLayers(entry: Entry, compact = false) {
  return gridTintLayers({ x: entry.grid_x, y: entry.grid_y }, entryPreset(compact))
}

export type EntryCloudBlob = GridTintBlob
export type EntryCardCloudLayers = GridTintLayers

