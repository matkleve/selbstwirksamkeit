import {
  bilinearColor,
  gridReferenzAxisRgb,
  gridValenceAxisRgb,
} from '@/lib/gridZones'
import { getValenceColor } from '@/lib/types'

export type GridTintPreset = 'card' | 'card-compact' | 'button' | 'flat'

export interface GridPosition {
  x: number | null
  y?: number | null
}

export type GridTintBlob = {
  left: number
  top: number
  rgb: readonly [number, number, number]
  opacity: number
  scale: number
  variant: 0 | 1 | 2 | 3 | 4
  layer: 'smoke' | 'hero'
}

export type GridTintLayers = {
  smoke: GridTintBlob[]
  hero: GridTintBlob
}

const PRESETS = {
  card: {
    baseMix: 8,
    borderMix: 48,
    valenceBaseMix: 12,
    mesh: true,
    animate: true,
    meshScale: 1,
  },
  'card-compact': {
    baseMix: 10,
    borderMix: 48,
    valenceBaseMix: 12,
    mesh: true,
    animate: true,
    meshScale: 0.58,
  },
  button: {
    baseMix: 12,
    borderMix: 55,
    valenceBaseMix: 18,
    mesh: true,
    animate: false,
    meshScale: 0.85,
  },
  flat: {
    baseMix: 18,
    borderMix: 45,
    valenceBaseMix: 14,
    mesh: false,
    animate: false,
    meshScale: 0,
  },
} as const

function gridToPercent(x: number, y: number) {
  return {
    left: ((x + 5) / 10) * 100,
    top: ((5 - y) / 10) * 100,
  }
}

export function gridTintRgb(pos: GridPosition): [number, number, number] | null {
  if (pos.x === null) return null
  return bilinearColor(pos.x, pos.y ?? 0)
}

export function gridTintMix(
  rgb: readonly [number, number, number],
  amount: number,
  base = 'var(--bg-card)',
): string {
  const [r, g, b] = rgb
  return `color-mix(in srgb, rgb(${r}, ${g}, ${b}) ${amount}%, ${base})`
}

function rgba(rgb: readonly [number, number, number], alpha: number) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

/** Pull grid colours toward card white — aurora look, not neon. */
function pastelRgb(rgb: readonly [number, number, number], white = 0.38): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * white),
    Math.round(rgb[1] + (255 - rgb[1]) * white),
    Math.round(rgb[2] + (255 - rgb[2]) * white),
  ]
}

export type GridTintVeilId = 'valence' | 'referenz' | 'blend'

export type GridTintVeil = {
  id: GridTintVeilId
  backgroundImage: string
  drift: 'a' | 'b' | 'none'
}

function veilGradient(
  atX: number,
  atY: number,
  rgb: readonly [number, number, number],
  peak: number,
  w = 125,
  h = 115,
) {
  const c = pastelRgb(rgb, 0.36)
  return `radial-gradient(ellipse ${w}% ${h}% at ${atX}% ${atY}%, ${rgba(c, peak)} 0%, ${rgba(c, peak * 0.38)} 48%, transparent 76%)`
}

/**
 * Two axis colours (valence + referenz) that meet at the grid point — like the 2D field.
 */
export function gridTintVeils(
  pos: GridPosition,
  preset: GridTintPreset = 'card',
): GridTintVeil[] | null {
  const cfg = PRESETS[preset]
  if (!cfg.mesh || pos.x === null) return null

  const x = pos.x
  const y = pos.y ?? 0
  const s = cfg.meshScale
  const { left, top } = gridToPercent(x, y)

  const valenceRgb = gridValenceAxisRgb(x)
  const referenzRgb = gridReferenzAxisRgb(y)
  const meetRgb = pastelRgb(bilinearColor(x, y), 0.3)

  const veils: GridTintVeil[] = [
    {
      id: 'valence',
      drift: 'a',
      backgroundImage: veilGradient(left, 74, valenceRgb, 0.32 * s, 132, 118),
    },
    {
      id: 'referenz',
      drift: 'b',
      backgroundImage: veilGradient(18, top, referenzRgb, 0.28 * s, 118, 128),
    },
    {
      id: 'blend',
      drift: 'none',
      backgroundImage: veilGradient(left, top, meetRgb, 0.22 * s, 95, 88),
    },
  ]

  if (preset === 'button') {
    return veils.slice(0, 2)
  }

  return veils
}

/** @deprecated mesh replaces blob layers */
export function gridTintLayers(
  pos: GridPosition,
  preset: GridTintPreset = 'card',
): GridTintLayers | null {
  if (!PRESETS[preset].mesh || pos.x === null) return null
  const x = pos.x
  const y = pos.y ?? 0
  const center = gridToPercent(x, y)
  const primary = bilinearColor(x, y)
  return {
    smoke: [],
    hero: {
      left: center.left,
      top: center.top,
      rgb: primary,
      opacity: 0,
      scale: 1,
      variant: 0,
      layer: 'hero',
    },
  }
}

export function gridTintBackgroundStyle(
  pos: GridPosition,
  preset: GridTintPreset = 'card',
  base = 'var(--bg-card)',
): string {
  const cfg = PRESETS[preset]
  const rgb = gridTintRgb(pos)
  if (!rgb) {
    if (pos.x === null) return base
    return `color-mix(in srgb, ${getValenceColor(pos.x)} ${cfg.valenceBaseMix}%, ${base})`
  }
  return gridTintMix(rgb, cfg.baseMix, base)
}

export function gridTintBorderStyle(
  pos: GridPosition,
  preset: GridTintPreset = 'card',
  borderBase = 'var(--border)',
): string {
  const cfg = PRESETS[preset]
  const rgb = gridTintRgb(pos)
  if (!rgb) {
    return `color-mix(in srgb, ${getValenceColor(pos.x)} ${cfg.borderMix}%, ${borderBase})`
  }
  const [r, g, b] = rgb
  return `color-mix(in srgb, rgb(${r}, ${g}, ${b}) ${cfg.borderMix}%, ${borderBase})`
}

export function gridTintAccentColor(pos: GridPosition): string {
  const rgb = gridTintRgb(pos)
  if (rgb) {
    const [r, g, b] = rgb
    return `rgb(${r}, ${g}, ${b})`
  }
  return getValenceColor(pos.x)
}

export function gridTintBlobColor(
  rgb: readonly [number, number, number],
  layer: 'smoke' | 'hero',
  preset: GridTintPreset,
): string {
  if (layer === 'hero') {
    const [r, g, b] = rgb
    return `rgb(${r}, ${g}, ${b})`
  }
  return gridTintMix(rgb, PRESETS[preset].smokeMix)
}

export function gridTintBlobWidth(
  blob: GridTintBlob,
  preset: GridTintPreset,
): number {
  const cfg = PRESETS[preset]
  const base = blob.layer === 'hero' ? cfg.heroWidth : cfg.smokeWidth
  return base * blob.scale
}

export function gridTintShouldAnimate(preset: GridTintPreset): boolean {
  return PRESETS[preset].animate
}
