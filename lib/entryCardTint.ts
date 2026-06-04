import type { Entry } from '@/lib/types'
import {
  gridTintAccentColor,
  gridTintBackgroundStyle,
  gridTintBorderStyle,
  gridTintLayers,
  gridTintMix,
  gridTintRgb,
  type GridPosition,
  type GridTintBlob,
  type GridTintLayers,
  type GridTintPreset,
} from '@/lib/gridTint'

export type {
  GridPosition,
  GridTintBlob,
  GridTintLayers,
  GridTintPreset,
}

export {
  gridTintAccentColor,
  gridTintBackgroundStyle,
  gridTintBorderStyle,
  gridTintLayers,
  gridTintMix,
  gridTintRgb,
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

export function entryCardBackground(entry: Entry, compact = false): string {
  return gridTintBackgroundStyle(
    { x: entry.grid_x, y: entry.grid_y },
    entryPreset(compact),
  )
}

export function entryCardBorderColor(entry: Entry, compact = false): string {
  return gridTintBorderStyle(
    { x: entry.grid_x, y: entry.grid_y },
    entryPreset(compact),
  )
}

/** @deprecated use gridTintLayers */
export function entryCardCloudLayers(entry: Entry, compact = false) {
  return gridTintLayers({ x: entry.grid_x, y: entry.grid_y }, entryPreset(compact))
}

export type EntryCloudBlob = GridTintBlob
export type EntryCardCloudLayers = GridTintLayers

/** @deprecated use GridTintBackground */
export { GridTintBackground as EntryCardCloudBg } from '@/components/GridTintBackground'
