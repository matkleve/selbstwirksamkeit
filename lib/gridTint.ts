import {
  bilinearColor,
  CARD_TINT_OPACITY,
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
    tintOpacity: CARD_TINT_OPACITY,
    borderMix: 48,
    valenceBaseMix: 12,
    mesh: true,
    animate: true,
    meshScale: 1,
  },
  'card-compact': {
    baseMix: 10,
    tintOpacity: CARD_TINT_OPACITY,
    borderMix: 48,
    valenceBaseMix: 12,
    mesh: true,
    animate: true,
    meshScale: 0.92,
  },
  button: {
    baseMix: 12,
    tintOpacity: 0.18,
    borderMix: 55,
    valenceBaseMix: 18,
    mesh: true,
    animate: false,
    meshScale: 0.85,
  },
  flat: {
    baseMix: 18,
    tintOpacity: 0,
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

/** Lighten for blobs only — keep axis hues readable. */
function softenRgb(rgb: readonly [number, number, number], white = 0.14): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * white),
    Math.round(rgb[1] + (255 - rgb[1]) * white),
    Math.round(rgb[2] + (255 - rgb[2]) * white),
  ]
}

function auroraBlob(
  atX: number,
  atY: number,
  rgb: readonly [number, number, number],
  peak: number,
  w: number,
  h: number,
) {
  const c = softenRgb(rgb)
  return `radial-gradient(ellipse ${w}% ${h}% at ${atX}% ${atY}%, ${rgba(c, peak)} 0%, ${rgba(c, peak * 0.5)} 38%, transparent 72%)`
}

/** Static mesh: valence + referenz clouds + meet (stacked on compose-style wash). */
export function gridTintAuroraMesh(
  pos: GridPosition,
  preset: GridTintPreset = 'card',
): string | null {
  const cfg = PRESETS[preset]
  if (!cfg.mesh || pos.x === null) return null

  const x = pos.x
  const y = pos.y ?? 0
  const s = cfg.meshScale
  const { left, top } = gridToPercent(x, y)
  const valence = gridValenceAxisRgb(x)
  const referenz = gridReferenzAxisRgb(y)
  const meet = bilinearColor(x, y)

  return [
    auroraBlob(left, 84, valence, 0.14 * s, 148, 132),
    auroraBlob(6, top, referenz, 0.12 * s, 138, 142),
    auroraBlob(left, top, meet, 0.1 * s, 118, 110),
  ].join(', ')
}

/** Drift overlays — one animated layer per axis (GPU transform only). */
export function gridTintAuroraDrift(
  pos: GridPosition,
  preset: GridTintPreset = 'card',
): { a: string; b: string } | null {
  const cfg = PRESETS[preset]
  if (!cfg.mesh || pos.x === null) return null

  const x = pos.x
  const y = pos.y ?? 0
  const s = cfg.meshScale * 0.85
  const { left, top } = gridToPercent(x, y)
  const valence = gridValenceAxisRgb(x)
  const referenz = gridReferenzAxisRgb(y)

  return {
    a: auroraBlob(left - 8, 78, valence, 0.09 * s, 130, 118),
    b: auroraBlob(14, top + 6, referenz, 0.08 * s, 122, 128),
  }
}

/** Same rgba wash as compose `cardTintShadow` (no extra mesh on the shell). */
export function gridTintComposeFill(
  pos: GridPosition,
  opacity = CARD_TINT_OPACITY,
): string | null {
  if (pos.x === null) return null
  const [r, g, b] = bilinearColor(pos.x, pos.y ?? 0)
  return `linear-gradient(0deg, rgba(${r}, ${g}, ${b}, ${opacity}), rgba(${r}, ${g}, ${b}, ${opacity}))`
}

/** Saved cards: compose tint only — aurora lives in `GridTintBackground`. */
export function gridTintShellBackground(
  pos: GridPosition,
  preset: GridTintPreset = 'card',
  base = 'var(--bg-card)',
): string {
  if (pos.x === null) return base
  const fill = gridTintComposeFill(pos, PRESETS[preset].tintOpacity)
  return fill ?? base
}

export type GridTintVeilId = 'valence' | 'referenz'

export type GridTintVeil = {
  id: GridTintVeilId
  backgroundImage: string
  drift: 'a' | 'b'
}

/** @deprecated use gridTintAuroraDrift */
export function gridTintVeils(
  pos: GridPosition,
  preset: GridTintPreset = 'card',
): GridTintVeil[] | null {
  const drift = gridTintAuroraDrift(pos, preset)
  if (!drift) return null
  return [
    { id: 'valence', drift: 'a', backgroundImage: drift.a },
    { id: 'referenz', drift: 'b', backgroundImage: drift.b },
  ]
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
  if (cfg.mesh && gridTintRgb(pos)) {
    return gridTintShellBackground(pos, preset, base)
  }
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
