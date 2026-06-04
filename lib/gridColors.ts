import { gridTintMix, gridTintRgb } from '@/lib/gridTint'

/** CSS `rgb(...)` for a grid position (Ember & Jade bilinear). */
export function gridColorRgb(x: number, y: number): string {
  const rgb = gridTintRgb({ x, y })
  if (!rgb) return 'var(--text-muted)'
  const [r, g, b] = rgb
  return `rgb(${r}, ${g}, ${b})`
}

export function gridColorMix(
  x: number,
  y: number | null,
  amount: number,
  base = 'var(--bg-subtle)',
): string {
  const rgb = gridTintRgb({ x, y })
  if (!rgb) return base
  return gridTintMix(rgb, amount, base)
}

export function calendarDayBackground(
  count: number,
  avgGridX: number | null,
  avgGridY: number | null,
): string {
  if (count === 0 || avgGridX === null) return 'var(--bg-subtle)'
  const amount = Math.min(48 + (count - 1) * 12, 78)
  return gridColorMix(avgGridX, avgGridY, amount)
}
