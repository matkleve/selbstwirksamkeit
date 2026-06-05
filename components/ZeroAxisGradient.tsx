'use client'

import { useMemo } from 'react'
import { useYAxisScale } from 'recharts'
import {
  chartAxisGradientStops,
  type ChartAxisGradientMode,
} from '@/lib/chartAxisGradient'

interface Props {
  id: string
  mode: ChartAxisGradientMode
}

/**
 * Bilinear Y-axis stroke gradient pinned to the chart scale (50% at y = 0).
 * Uses expandAxis / bilinearColor so colour strengthens away from the zero line.
 */
export function ZeroAxisGradient({ id, mode }: Props) {
  const yScale = useYAxisScale()
  const stops = useMemo(() => chartAxisGradientStops(mode), [mode])

  if (!yScale) return null

  const yTop = yScale(5)
  const yBottom = yScale(-5)
  if (yTop == null || yBottom == null) return null

  return (
    <defs>
      <linearGradient
        id={id}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1={yTop}
        x2="0"
        y2={yBottom}
      >
        {stops.map(s => (
          <stop key={s.offset} offset={s.offset} stopColor={s.stopColor} />
        ))}
      </linearGradient>
    </defs>
  )
}
