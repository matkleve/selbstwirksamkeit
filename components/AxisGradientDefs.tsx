import { chartAxisGradientStops, type ChartAxisGradientMode } from '@/lib/chartAxisGradient'

interface Props {
  id: string
  mode: ChartAxisGradientMode
  yTop: number
  yBottom: number
}

/** Static-SVG variant (TrajectoryPatternChart). */
export function AxisGradientDefs({ id, mode, yTop, yBottom }: Props) {
  const stops = chartAxisGradientStops(mode)

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
