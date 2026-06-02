'use client'

import { memo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer,
} from 'recharts'
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
  const yStops =
    mode === 'valence'
      ? (
        <>
          <stop offset="0%" stopColor="var(--valence-neg-strong)" />
          <stop offset="50%" stopColor="var(--valence-neutral)" />
          <stop offset="100%" stopColor="var(--valence-pos-strong)" />
        </>
      )
      : (
        <>
          <stop offset="0%" stopColor="rgb(186, 144, 82)" />
          <stop offset="50%" stopColor="var(--valence-neutral)" />
          <stop offset="100%" stopColor="rgb(140, 120, 188)" />
        </>
      )

  return (
    <ResponsiveContainer width="100%" height={TRAJECTORY_CHART_H}>
      <LineChart data={data} margin={{ top: 10, right: 6, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
            {yStops}
          </linearGradient>
        </defs>
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
          tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
          tickFormatter={(v: number) => (v > 0 ? `+${v}` : String(v))}
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
