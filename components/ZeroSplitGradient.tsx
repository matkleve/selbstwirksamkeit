'use client'

import type { ReactNode } from 'react'
import { useYAxisScale } from 'recharts'

interface Props {
  id: string
  /** Data value at gradient offset 0% */
  yAt0: number
  /** Data value at gradient offset 100% */
  yAt100: number
  children: ReactNode
}

/** Pins SVG linearGradient stops to chart Y-axis coordinates (e.g. zero line at 50%). */
export function ZeroSplitGradient({ id, yAt0, yAt100, children }: Props) {
  const yScale = useYAxisScale()
  if (!yScale) return null

  const y1 = yScale(yAt0)
  const y2 = yScale(yAt100)
  if (y1 == null || y2 == null) return null

  return (
    <defs>
      <linearGradient
        id={id}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1={y1}
        x2="0"
        y2={y2}
      >
        {children}
      </linearGradient>
    </defs>
  )
}
