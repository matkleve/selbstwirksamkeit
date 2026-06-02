'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/cn'
import { catmullRomPath } from '@/lib/trailPath'
import { bilinearColor } from '@/lib/gridZones'
import type { Entry } from '@/lib/types'
import type { TrajectoryPoint } from '@/components/TrajectoryLineChart'

const TrajectoryLineChart = dynamic(() => import('@/components/TrajectoryLineChart'), { ssr: false })

type AxisMode = 'valence' | 'referenz' | 'both'
const DAY_STEPS = [7, 14, 30, 90] as const

const MODES: { id: AxisMode; label: string }[] = [
  { id: 'valence', label: '− / +' },
  { id: 'referenz', label: 'ich / andere' },
  { id: 'both', label: 'beide' },
]

function ringPoint(index: number, total: number, radius: number, cx: number, cy: number) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
}

function entryOpacity(createdAt: string, newestMs: number, oldestMs: number): number {
  const t = new Date(createdAt).getTime()
  const range = newestMs - oldestMs
  if (range <= 0) return 1
  const age = newestMs - t
  return 0.2 + 0.8 * (1 - age / range)
}

interface Props {
  entries: Entry[]
}

export default function TrajectoryCard({ entries }: Props) {
  const [mode, setMode] = useState<AxisMode>('valence')
  const [dayIndex, setDayIndex] = useState(1)

  const days = DAY_STEPS[dayIndex]

  const windowEntries = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return entries
      .filter(e => new Date(e.created_at).getTime() >= cutoff)
      .filter(e => e.grid_x !== null && (mode !== 'referenz' || e.grid_y !== null))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [entries, days, mode])

  const lineData = useMemo((): TrajectoryPoint[] => {
    if (mode === 'both') return []
    return windowEntries.map(e => {
      const d = new Date(e.created_at)
      const label = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })
      const value = mode === 'valence' ? (e.grid_x ?? 0) : (e.grid_y ?? 0)
      return { label, value, text: e.text }
    })
  }, [windowEntries, mode])

  const ring = useMemo(() => {
    if (mode !== 'both' || windowEntries.length < 2) return null
    const cx = 50
    const cy = 50
    const r = 38
    const pts = windowEntries.map((_, i) => ringPoint(i, windowEntries.length, r, cx, cy))
    const newestMs = new Date(windowEntries[windowEntries.length - 1].created_at).getTime()
    const oldestMs = new Date(windowEntries[0].created_at).getTime()
    const dots = windowEntries.map((e, i) => {
      const [cr, cg, cb] = bilinearColor(e.grid_x ?? 0, e.grid_y ?? 0)
      return {
        ...pts[i],
        fill: `rgb(${cr},${cg},${cb})`,
        opacity: entryOpacity(e.created_at, newestMs, oldestMs),
      }
    })
    const closed = pts.length > 2 ? [...pts, pts[0]] : pts
    return { path: catmullRomPath(closed), dots }
  }, [mode, windowEntries])

  const dayLabel = `${days} Tage`

  return (
    <div className="mb-3.5 rounded-card border border-edge bg-card p-5 shadow-card">
      <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-ink-3">
        Verlauf
      </p>

      <div className="mb-3 flex gap-1.5">
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              'flex-1 rounded-field border px-2 py-2 text-center text-sm transition-colors',
              mode === m.id
                ? 'border-ink bg-ink text-ink-inv'
                : 'border-edge bg-subtle text-ink-2 hover:border-ring hover:text-ink',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-xs text-ink-3">
          <span>Zeitraum</span>
          <span>{dayLabel}</span>
        </div>
        <input
          type="range"
          min={0}
          max={DAY_STEPS.length - 1}
          step={1}
          value={dayIndex}
          onChange={e => setDayIndex(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-ink"
          aria-label={`Zeitraum: ${dayLabel}`}
        />
        <div className="mt-1 flex justify-between text-[0.625rem] text-ink-3">
          {DAY_STEPS.map(d => (
            <span key={d}>{d}d</span>
          ))}
        </div>
      </div>

      {windowEntries.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-3">
          Keine Einträge mit Koordinaten in diesem Zeitraum.
        </p>
      ) : mode === 'both' && ring ? (
        <div className="mx-auto aspect-square max-w-[240px]">
          <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
            <path
              d={ring.path}
              fill="none"
              stroke="var(--border-focus)"
              strokeWidth={0.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.55}
            />
            {ring.dots.map((d, i) => (
              <circle
                key={windowEntries[i].id}
                cx={d.x}
                cy={d.y}
                r={2.2}
                fill={d.fill}
                opacity={d.opacity}
              />
            ))}
          </svg>
        </div>
      ) : lineData.length > 0 ? (
        <TrajectoryLineChart data={lineData} />
      ) : null}
    </div>
  )
}
