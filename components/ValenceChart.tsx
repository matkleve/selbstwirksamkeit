'use client'

import {
  LineChart, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { ZeroSplitLines } from '@/components/ZeroSplitLines'

export interface ChartPoint {
  label: string
  value: number | null
  text?: string
}

interface Props {
  data: ChartPoint[]
}

function CustomDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props
  if (!cx || !cy || payload?.value == null) return null
  const color = payload.value >= 0 ? '#3B7DD8' : '#C4603A'
  return <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="none" />
}

function CustomTooltip(props: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  const { active, payload } = props
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d.value == null) return null
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      maxWidth: 220,
      boxShadow: 'var(--shadow-pop)',
      fontSize: '0.8125rem',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>
        {d.label} · {d.value > 0 ? '+' : ''}{d.value.toFixed(1)}
      </div>
      {d.text && (
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          „{d.text.slice(0, 80)}{d.text.length > 80 ? '…' : ''}“
        </div>
      )}
    </div>
  )
}

export default function ValenceChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={130}>
      <LineChart data={data} margin={{ top: 10, right: 6, bottom: 4, left: 24 }}>
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
        <ZeroSplitLines
          id="valGrad"
          dataKey="value"
          colorAbove="#3B7DD8"
          colorBelow="#C4603A"
          dot={<CustomDot />}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
