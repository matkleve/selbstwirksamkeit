'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Minus, Plus, User, Users, LayoutGrid, Sunrise, CalendarDays, Leaf, Calendar } from 'lucide-react'
import { cn } from '@/lib/cn'
import TrajectoryPatternChart from '@/components/TrajectoryPatternChart'
import TrajectoryPatternGridChart from '@/components/TrajectoryPatternGridChart'
import {
  buildPatternChart,
  defaultCustomRange,
  formatCustomRangeSubtitle,
  periodHint,
  periodToFold,
  type PatternAxisMode,
  type PatternPeriod,
  type PatternFold,
} from '@/lib/trajectoryPattern'
import { TRAJECTORY_CHART_BLOCK_MIN_H, TRAJECTORY_FIELD_MAX_SIZE } from '@/lib/trajectoryChartLayout'
import type { Entry } from '@/lib/types'

const AXIS_MODES: { id: PatternAxisMode; label: string }[] = [
  { id: 'valence', label: 'Valenz (− / +)' },
  { id: 'referenz', label: 'Bezug (ich / andere)' },
  { id: 'both', label: 'Feld (beide Achsen)' },
]

const PERIODS: {
  id: PatternPeriod
  label: string
  Icon: typeof Sunrise
}[] = [
  { id: 'tag', label: 'Tageszeiten', Icon: Sunrise },
  { id: 'woche', label: 'Wochentage', Icon: CalendarDays },
  { id: 'jahr', label: 'Jahreszeiten', Icon: Leaf },
  { id: 'kalender', label: 'Zeitraum wählen', Icon: Calendar },
]

function ToolbarIconButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-1 items-center justify-center rounded-field border py-2.5 transition-colors',
        active
          ? 'border-ink bg-ink text-ink-inv'
          : 'border-edge bg-subtle text-ink-2 hover:border-ring hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

interface Props {
  entries: Entry[]
  className?: string
}

export default function TrajectoryPatternCard({ entries, className }: Props) {
  const withCoords = entries.filter(e => e.grid_x !== null)
  const defaults = useMemo(() => defaultCustomRange(entries), [entries])

  const [period, setPeriod] = useState<PatternPeriod>('woche')
  const [lastFold, setLastFold] = useState<PatternFold>('week')
  const [axisMode, setAxisMode] = useState<PatternAxisMode>('valence')
  const [customFrom, setCustomFrom] = useState(defaults.from)
  const [customTo, setCustomTo] = useState(defaults.to)

  const fold = periodToFold(period, lastFold)

  const pickPeriod = (p: PatternPeriod) => {
    setPeriod(p)
    if (p === 'tag') setLastFold('day')
    if (p === 'woche') setLastFold('week')
    if (p === 'jahr') setLastFold('year')
    if (p === 'kalender') {
      setCustomFrom(defaults.from)
      setCustomTo(defaults.to)
    }
  }

  const { series, slots, filteredCount } = useMemo(
    () => buildPatternChart(entries, period, fold, axisMode, customFrom, customTo),
    [entries, period, fold, axisMode, customFrom, customTo],
  )

  const subtitle =
    period === 'kalender'
      ? formatCustomRangeSubtitle(customFrom, customTo)
      : periodHint(period)

  const hasLineData = series.some(s => s.points.some(p => p.value != null))
  const hasFieldData = series.some(s => s.points.some(p => p.value != null))

  if (!withCoords.length) {
    return (
      <div className={cn('rounded-card border border-edge bg-card p-5 shadow-card', className)}>
        <p className="mb-1 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-ink-3">
          Zeitspur
        </p>
        <p className="py-6 text-center text-sm text-ink-3">
          Noch keine Einträge mit Koordinaten.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-card border border-edge bg-card p-5 shadow-card', className)}>
      <div className="mb-3">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-ink-3">
          Zeitspur
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-ink-3">{subtitle}</p>
      </div>

      <div className="mb-3 flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          {AXIS_MODES.map(m => (
            <ToolbarIconButton
              key={m.id}
              active={axisMode === m.id}
              label={m.label}
              onClick={() => setAxisMode(m.id)}
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
                <LayoutGrid size={17} strokeWidth={1.75} aria-hidden />
              )}
            </ToolbarIconButton>
          ))}
        </div>
        <div className="flex gap-1.5">
          {PERIODS.map(p => (
            <ToolbarIconButton
              key={p.id}
              active={period === p.id}
              label={p.label}
              onClick={() => pickPeriod(p.id)}
            >
              <p.Icon size={17} strokeWidth={1.75} aria-hidden />
            </ToolbarIconButton>
          ))}
        </div>
      </div>

      {period === 'kalender' && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[0.625rem] text-ink-3">Von</span>
            <input
              type="date"
              lang="de"
              value={customFrom}
              max={customTo}
              onChange={e => setCustomFrom(e.target.value)}
              className="field-input rounded-field border border-edge bg-field px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[0.625rem] text-ink-3">Bis</span>
            <input
              type="date"
              lang="de"
              value={customTo}
              min={customFrom}
              onChange={e => setCustomTo(e.target.value)}
              className="field-input rounded-field border border-edge bg-field px-3 py-2 text-sm text-ink"
            />
          </label>
        </div>
      )}

      <div
        className="flex flex-col justify-center"
        style={{
          minHeight:
            axisMode === 'both' ? TRAJECTORY_FIELD_MAX_SIZE : TRAJECTORY_CHART_BLOCK_MIN_H,
        }}
      >
        {filteredCount === 0 ? (
          <p className="py-6 text-center text-sm text-ink-3">
            Keine Einträge in diesem Zeitfenster.
          </p>
        ) : axisMode === 'both' && hasFieldData ? (
          <TrajectoryPatternGridChart series={series} slots={slots} />
        ) : hasLineData ? (
          <TrajectoryPatternChart series={series} slots={slots} mode={axisMode} />
        ) : (
          <p className="py-6 text-center text-sm text-ink-3">
            Zu wenig Daten für eine Linie in diesem Muster.
          </p>
        )}
      </div>
    </div>
  )
}
