'use client'

import type { ReactElement } from 'react'
import { Line } from 'recharts'
import { ZeroClipPaths } from '@/components/ZeroClipPaths'

interface Props {
  id: string
  dataKey: string
  colorAbove: string
  colorBelow: string
  strokeWidth?: number
  dot: ReactElement
  connectNulls?: boolean
}

/**
 * Monotone line split at y=0: solid colours above/below, hard cut on the reference line.
 * (Chart-wide gradients mute values near zero on a [-5, 5] domain.)
 */
export function ZeroSplitLines({
  id,
  dataKey,
  colorAbove,
  colorBelow,
  strokeWidth = 2,
  dot,
  connectNulls = false,
}: Props) {
  const lineProps = {
    type: 'monotone' as const,
    dataKey,
    strokeWidth,
    connectNulls,
    isAnimationActive: false,
    activeDot: false,
    legendType: 'none' as const,
    tooltipType: 'none' as const,
  }

  return (
    <>
      <ZeroClipPaths prefix={id} />
      <g clipPath={`url(#${id}-above)`}>
        <Line {...lineProps} stroke={colorAbove} dot={false} />
      </g>
      <g clipPath={`url(#${id}-below)`}>
        <Line {...lineProps} stroke={colorBelow} dot={false} />
      </g>
      <Line {...lineProps} stroke="none" dot={dot} />
    </>
  )
}
