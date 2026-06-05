'use client'

import type { ReactNode } from 'react'
import { User, Users } from 'lucide-react'
import { cn } from '@/lib/cn'
import { gridReferenzAxisRgb, gridValenceAxisRgb } from '@/lib/gridZones'

export type GridAxisSliderSize = 'xs' | 'sm' | 'md'

const SIZES = {
  xs: { barW: 44, barH: 4, padX: 2, gap: 4, labelW: 10, icon: 9, text: 'text-[0.5625rem]' },
  sm: { barW: 56, barH: 6, padX: 3, gap: 4, labelW: 12, icon: 10, text: 'text-[0.625rem]' },
  md: { barW: 72, barH: 8, padX: 4, gap: 6, labelW: 14, icon: 12, text: 'text-xs' },
} as const satisfies Record<GridAxisSliderSize, {
  barW: number
  barH: number
  padX: number
  gap: number
  labelW: number
  icon: number
  text: string
}>

function rgbCss(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

/** Pastell — vier Pole: docs/specs/design-system.md */
function lightenDot(rgb: [number, number, number]): string {
  const mix = 0.28
  return rgbCss([
    Math.round(rgb[0] + (255 - rgb[0]) * mix),
    Math.round(rgb[1] + (255 - rgb[1]) * mix),
    Math.round(rgb[2] + (255 - rgb[2]) * mix),
  ])
}

export function gridAxisDotColor(axis: 'valence' | 'referenz', value: number): string {
  const rgb = axis === 'valence' ? gridValenceAxisRgb(value) : gridReferenzAxisRgb(value)
  return lightenDot(rgb)
}

function thumbLeftPct(value: number, barW: number, padX: number, thumb: number): number {
  const t = (Math.max(-5, Math.min(5, value)) + 5) / 10
  const inner = barW - 2 * padX
  const px = padX + t * inner - thumb / 2
  return (px / barW) * 100
}

export interface GridAxisSliderProps {
  /** Grid axis value −5…+5 */
  value: number
  dotColor: string
  left: ReactNode
  right: ReactNode
  size?: GridAxisSliderSize
  className?: string
  'aria-label'?: string
}

/** Read-only axis track with colored thumb (valence or referenz). */
export function GridAxisSlider({
  value,
  dotColor,
  left,
  right,
  size = 'xs',
  className,
  'aria-label': ariaLabel,
}: GridAxisSliderProps) {
  const cfg = SIZES[size]
  const thumb = cfg.barH
  const leftPct = thumbLeftPct(value, cfg.barW, cfg.padX, thumb)

  return (
    <div
      className={cn('flex items-center', className)}
      style={{ gap: cfg.gap }}
      aria-label={ariaLabel}
    >
      <div
        className="flex shrink-0 items-center justify-center text-ink-3"
        style={{ width: cfg.labelW }}
      >
        {left}
      </div>
      <div
        className="relative shrink-0 overflow-hidden rounded-full bg-subtle"
        style={{ width: cfg.barW, height: cfg.barH }}
      >
        <div
          className="absolute top-0 rounded-full"
          style={{
            width: thumb,
            height: thumb,
            left: `${leftPct}%`,
            background: dotColor,
          }}
          aria-hidden
        />
      </div>
      <div
        className="flex shrink-0 items-center justify-center text-ink-3"
        style={{ width: cfg.labelW }}
      >
        {right}
      </div>
    </div>
  )
}

export interface EntryGridAxisReadoutProps {
  x: number
  y: number | null
  size?: GridAxisSliderSize
  className?: string
}

/** Dual readout for entry cards: valence (−/+) and referenz (ich/andere). */
export function EntryGridAxisReadout({ x, y, size = 'xs', className }: EntryGridAxisReadoutProps) {
  const cfg = SIZES[size]
  const valenceDot = gridAxisDotColor('valence', x)
  const referenzDot = y !== null ? gridAxisDotColor('referenz', y) : null

  const groupLabel =
    y !== null
      ? `Stimmung ${x > 0 ? 'positiv' : x < 0 ? 'schwer' : 'neutral'}, Bezug ${y > 0 ? 'andere' : y < 0 ? 'ich' : 'neutral'}`
      : `Stimmung ${x > 0 ? 'positiv' : x < 0 ? 'schwer' : 'neutral'}`

  return (
    <div
      className={cn('flex items-center', size === 'md' ? 'gap-3' : 'gap-2', className)}
      aria-label={groupLabel}
    >
      <GridAxisSlider
        value={x}
        dotColor={valenceDot}
        size={size}
        left={<span className={cn(cfg.text, 'leading-none')}>−</span>}
        right={<span className={cn(cfg.text, 'leading-none')}>+</span>}
      />
      {y !== null && referenzDot && (
        <GridAxisSlider
          value={y}
          dotColor={referenzDot}
          size={size}
          left={<User size={cfg.icon} strokeWidth={1.75} aria-hidden />}
          right={<Users size={cfg.icon} strokeWidth={1.75} aria-hidden />}
        />
      )}
    </div>
  )
}
