'use client'

import { usePlotArea, useYAxisScale } from 'recharts'

interface Props {
  prefix: string
}

/** Clip rects pinned to the Y=0 axis line (plot-area coordinates). */
export function ZeroClipPaths({ prefix }: Props) {
  const plot = usePlotArea()
  const yScale = useYAxisScale()
  if (!plot || !yScale) return null

  const y0 = yScale(0)
  if (y0 == null) return null

  const aboveH = Math.max(0, y0 - plot.y)
  const belowH = Math.max(0, plot.y + plot.height - y0)

  return (
    <defs>
      <clipPath id={`${prefix}-above`}>
        <rect x={plot.x} y={plot.y} width={plot.width} height={aboveH} />
      </clipPath>
      <clipPath id={`${prefix}-below`}>
        <rect x={plot.x} y={y0} width={plot.width} height={belowH} />
      </clipPath>
    </defs>
  )
}
