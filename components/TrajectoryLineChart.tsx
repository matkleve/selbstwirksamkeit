'use client'

import { memo } from 'react'
import { User, Users } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { ZeroSplitGradient } from '@/components/ZeroSplitGradient'
import { bilinearColor } from '@/lib/gridZones'
import { TRAJECTORY_CHART_H } from '@/lib/trajectoryChartLayout'

export interface TrajectoryPoint {
  label: string
  value: number
  text?: string
  gridX?: number
  gridY?: number
}

export type TrajectoryChartMode = 'valence' | 'referenz'

interface Props {
  data: TrajectoryPoint[]
  mode: TrajectoryChartMode
}

function dotRgb(mode: TrajectoryChartMode, p: TrajectoryPoint): string {
  const x = mode === 'valence' ? p.value : (p.gridX ?? 0)
  const y = mode === 'referenz' ? p.value : (p.gridY ?? 0)
  const [r, g, b] = bilinearColor(x, y)
  return `rgb(${r},${g},${b})`
}

function CustomDot(props: {
  cx?: number
  cy?: number
  payload?: TrajectoryPoint
  mode: TrajectoryChartMode
}) {
  const { cx, cy, payload, mode } = props
  if (!cx || !cy || payload?.value == null) return null
  return <circle cx={cx} cy={cy} r={3.5} fill={dotRgb(mode, payload)} stroke="none" />
}

function YAxisTick(props: {
  x?: number
  y?: number
  payload?: { value: number }
  mode: TrajectoryChartMode
}) {
  const { x = 0, y = 0, payload, mode } = props
  const v = payload?.value ?? 0
  if (mode === 'referenz' && (v === 5 || v === -5)) {
    const Icon = v > 0 ? Users : User
    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-24} y={-6} width={22} height={12}>
          <div className="flex h-full items-center justify-end text-ink-3"
          >
            <Icon size={10} strokeWidth={1.5} aria-hidden />
          </div>
        </foreignObject>
      </g>
    )
  }
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="var(--text-muted)"
      fontSize={9}
    >
      {v === 0 ? '0' : v > 0 ? '+' : '−'}
    </text>
  )
}

function CustomTooltip(props: {
  active?: boolean
  payload?: Array<{ payload: TrajectoryPoint }>
}) {
  const { active, payload } = props
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="max-w-[220px] rounded-lg border border-edge bg-card px-3 py-2 text-[0.8125rem] shadow-[var(--shadow-pop)]">
      <div className="mb-0.5 text-ink-3">
        {d.label} · {d.value > 0 ? '+' : ''}{d.value.toFixed(1)}
      </div>
      {d.text && (
        <div className="leading-snug text-ink-2">
          &ldquo;{d.text.slice(0, 80)}{d.text.length > 80 ? '…' : ''}&rdquo;
        </div>
      )}
    </div>
  )
}

function TrajectoryLineChart({ data, mode }: Props) {
  const gradId = `traj-y-${mode}`
  const yStops = mode === 'valence' ? (
    <>
      <stop offset="0%" stopColor="var(--grid-neg-ich)" />
      <stop offset="50%" stopColor="var(--valence-neutral)" />
      <stop offset="100%" stopColor="var(--grid-pos-andere)" />
    </>
  ) : (
    <>
      <stop offset="0%" stopColor="var(--grid-pos-ich)" />
      <stop offset="50%" stopColor="var(--valence-neutral)" />
      <stop offset="100%" stopColor="var(--grid-neg-andere)" />
    </>
  )

  return (
    <ResponsiveContainer width="100%" height={TRAJECTORY_CHART_H}>
      <LineChart data={data} margin={{ top: 10, right: 6, bottom: 4, left: 4 }}>
        <ZeroSplitGradient id={gradId} yAt0={-5} yAt100={5}>
          {yStops}
        </ZeroSplitGradient>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[-5, 5]}
          ticks={[-5, 0, 5]}
          tick={<YAxisTick mode={mode} />}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <ReferenceLine y={0} stroke="var(--border-focus)" strokeDasharray="4 3" strokeWidth={1} />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={`url(#${gradId})`}
          strokeWidth={2}
          dot={<CustomDot mode={mode} />}
          activeDot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default memo(TrajectoryLineChart)
