'use client'

import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer,
} from 'recharts'

export interface TrajectoryPoint {
  label: string
  value: number
  text?: string
}

interface Props {
  data: TrajectoryPoint[]
  positiveColor?: string
  negativeColor?: string
}

function CustomDot(props: { cx?: number; cy?: number; payload?: TrajectoryPoint }) {
  const { cx, cy, payload } = props
  if (!cx || !cy || payload?.value == null) return null
  const color = payload.value >= 0 ? '#3B7DD8' : '#C4603A'
  return <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="none" />
}

function CustomTooltip(props: { active?: boolean; payload?: Array<{ payload: TrajectoryPoint }> }) {
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

export default function TrajectoryLineChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={130}>
      <LineChart data={data} margin={{ top: 10, right: 6, bottom: 4, left: 24 }}>
        <defs>
          <linearGradient id="trajGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="50%" stopColor="#3B7DD8" />
            <stop offset="50%" stopColor="#C4603A" />
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
          axisLine={false}
          tickLine={false}
          width={22}
        />
        <ReferenceLine y={0} stroke="var(--border-focus)" strokeDasharray="4 3" strokeWidth={1} />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="url(#trajGrad)"
          strokeWidth={2}
          dot={<CustomDot />}
          activeDot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
