import { bilinearColor } from '@/lib/gridZones'
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
    baseMix: 14,
    borderMix: 48,
    valenceBaseMix: 12,
    smoke: true,
    hero: true,
    animate: true,
    heroScale: 0.62,
    heroOpacity: 0.62,
    heroWidth: 48,
    smokeWidth: 62,
    smokeMix: 38,
    smokeOffsets: [
      { dx: -2.6, dy: 1.8, scale: 1.05, opacity: 0.24, variant: 1 as const },
      { dx: 2.8, dy: -1.5, scale: 0.92, opacity: 0.2, variant: 2 as const },
      { dx: 0.5, dy: 2.6, scale: 0.88, opacity: 0.18, variant: 3 as const },
      { dx: -1.6, dy: -2.4, scale: 0.94, opacity: 0.21, variant: 4 as const },
    ],
  },
  'card-compact': {
    baseMix: 13,
    borderMix: 48,
    valenceBaseMix: 12,
    smoke: false,
    hero: false,
    animate: false,
    heroScale: 0,
    heroOpacity: 0,
    heroWidth: 0,
    smokeWidth: 0,
    smokeMix: 38,
    smokeOffsets: [],
  },
  button: {
    baseMix: 24,
    borderMix: 55,
    valenceBaseMix: 18,
    smoke: true,
    hero: true,
    animate: false,
    heroScale: 0.5,
    heroOpacity: 0.55,
    heroWidth: 56,
    smokeWidth: 70,
    smokeMix: 42,
    smokeOffsets: [
      { dx: -2, dy: 1.2, scale: 0.85, opacity: 0.2, variant: 1 as const },
      { dx: 2.2, dy: -1, scale: 0.78, opacity: 0.16, variant: 2 as const },
    ],
  },
  flat: {
    baseMix: 18,
    borderMix: 45,
    valenceBaseMix: 14,
    smoke: false,
    hero: false,
    animate: false,
    heroScale: 0,
    heroOpacity: 0,
    heroWidth: 0,
    smokeWidth: 0,
    smokeMix: 38,
    smokeOffsets: [],
  },
} as const

function gridToPercent(x: number, y: number) {
  return {
    left: ((x + 5) / 10) * 100,
    top: ((5 - y) / 10) * 100,
  }
}

function clampGrid(v: number) {
  return Math.max(-5, Math.min(5, v))
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

export function gridTintLayers(
  pos: GridPosition,
  preset: GridTintPreset = 'card',
): GridTintLayers | null {
  const cfg = PRESETS[preset]
  if (!cfg.smoke && !cfg.hero) return null
  if (pos.x === null) return null

  const x = pos.x
  const y = pos.y ?? 0
  const center = gridToPercent(x, y)
  const primary = bilinearColor(x, y)

  const hero: GridTintBlob = {
    left: center.left,
    top: center.top,
    rgb: primary,
    opacity: cfg.heroOpacity,
    scale: cfg.heroScale,
    variant: 0,
    layer: 'hero',
  }

  const smoke = cfg.smokeOffsets.map(o => {
    const sx = clampGrid(x + o.dx)
    const sy = clampGrid(y + o.dy)
    const p = gridToPercent(sx, sy)
    return {
      left: p.left,
      top: p.top,
      rgb: bilinearColor(sx, sy),
      opacity: o.opacity,
      scale: o.scale,
      variant: o.variant,
      layer: 'smoke' as const,
    }
  })

  return { smoke, hero }
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
