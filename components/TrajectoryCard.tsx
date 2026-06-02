'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Minus, Plus, User, Users, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/cn'
import TrajectoryRangeSlider from '@/components/TrajectoryRangeSlider'
import TrajectoryGridChart from '@/components/TrajectoryGridChart'
import { sliderToTime } from '@/lib/trajectoryTime'
import type { Entry } from '@/lib/types'
import type { TrajectoryPoint } from '@/components/TrajectoryLineChart'

const TrajectoryLineChart = dynamic(() => import('@/components/TrajectoryLineChart'), { ssr: false })

type AxisMode = 'valence' | 'referenz' | 'both'

const MODES: {
  id: AxisMode
  label: string
  Icon: typeof Minus
  iconClass?: string
}[] = [
  { id: 'valence', label: 'Valenz (− / +)', Icon: Plus, iconClass: 'gap-0.5' },
  { id: 'referenz', label: 'Bezug (ich / andere)', Icon: Users },
  { id: 'both', label: 'Feld (beide Achsen)', Icon: LayoutGrid },
]

interface Props {
  entries: Entry[]
}

export default function TrajectoryCard({ entries }: Props) {
  const [mode, setMode] = useState<AxisMode>('valence')

  const timeBounds = useMemo(() => {
    const withCoords = entries.filter(e => e.grid_x !== null)
    if (!withCoords.length) return null
    const times = withCoords.map(e => new Date(e.created_at).getTime())
    const first = Math.min(...times)
    const last = Date.now()
    return { first, last }
  }, [entries])

  const [range, setRange] = useState({ start: 0, end: 1 })

  const windowEntries = useMemo(() => {
    if (!timeBounds) return []
    const from = sliderToTime(range.start, timeBounds.first, timeBounds.last)
    const to = sliderToTime(range.end, timeBounds.first, timeBounds.last)
    return entries
      .filter(e => {
        const t = new Date(e.created_at).getTime()
        if (t < from || t > to) return false
        if (e.grid_x === null) return false
        if (mode === 'referenz' && e.grid_y === null) return false
        if (mode === 'both' && e.grid_y === null) return false
        return true
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [entries, timeBounds, range, mode])

  const lineData = useMemo((): TrajectoryPoint[] => {
    if (mode === 'both') return []
    return windowEntries.map(e => {
      const d = new Date(e.created_at)
      const label = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })
      const value = mode === 'valence' ? (e.grid_x ?? 0) : (e.grid_y ?? 0)
      return {
        label,
        value,
        text: e.text,
        gridX: e.grid_x ?? 0,
        gridY: e.grid_y ?? 0,
      }
    })
  }, [windowEntries, mode])

  if (!timeBounds) {
    return (
      <div className="mb-3.5 rounded-card border border-edge bg-card p-5 shadow-card">
        <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-ink-3">
          Zeitspur
        </p>
        <p className="py-6 text-center text-sm text-ink-3">
          Noch keine Einträge mit Koordinaten.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-3.5 rounded-card border border-edge bg-card p-5 shadow-card">
      <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-ink-3">
        Zeitspur
      </p>

      <div className="mb-3 flex gap-1.5">
        {MODES.map(m => {
          const active = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              aria-label={m.label}
              title={m.label}
              onClick={() => setMode(m.id)}
              className={cn(
                'flex flex-1 items-center justify-center rounded-field border py-2.5 transition-colors',
                active
                  ? 'border-ink bg-ink text-ink-inv'
                  : 'border-edge bg-subtle text-ink-2 hover:border-ring hover:text-ink',
              )}
            >
              {m.id === 'valence' ? (
                <span className="inline-flex items-center gap-0.5" aria-hidden>
                  <Minus size={16} strokeWidth={2} />
                  <Plus size={16} strokeWidth={2} />
                </span>
              ) : m.id === 'referenz' ? (
                <span className="inline-flex items-center gap-1" aria-hidden>
                  <User size={15} strokeWidth={1.75} />
                  <Users size={15} strokeWidth={1.75} />
                </span>
              ) : (
                <m.Icon size={17} strokeWidth={1.75} aria-hidden />
              )}
            </button>
          )
        })}
      </div>

      <TrajectoryRangeSlider
        minT={timeBounds.first}
        maxT={timeBounds.last}
        start={range.start}
        end={range.end}
        onChange={(start, end) => setRange({ start, end })}
      />

      {windowEntries.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-3">
          Keine Einträge in diesem Zeitfenster.
        </p>
      ) : mode === 'both' ? (
        <TrajectoryGridChart entries={windowEntries} />
      ) : lineData.length > 0 ? (
        <TrajectoryLineChart data={lineData} mode={mode} />
      ) : null}
    </div>
  )
}
