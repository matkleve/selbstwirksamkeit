'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDownAZ, SlidersHorizontal } from 'lucide-react'
import TimelineCard from '@/components/TimelineCard'
import { EntryDisplay } from '@/components/entry'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import {
  TIMELINE_DENSITY_OPTIONS,
  TIMELINE_FILTER_OPTIONS,
  TIMELINE_SORT_OPTIONS,
  entriesForDotStrip,
  filterEntries,
  groupEntriesByDate,
  sortEntries,
  type TimelineDensity,
  type TimelineFilter,
  type TimelineSort,
} from '@/lib/timelineView'
import type { Entry } from '@/lib/types'
import { getValenceColor } from '@/lib/types'

const STORAGE_KEY = 'selbstwirksamkeit-timeline-view'

interface StoredPrefs {
  density: TimelineDensity
  sort: TimelineSort
  filter: TimelineFilter
}

function loadPrefs(): StoredPrefs {
  if (typeof window === 'undefined') {
    return { density: 'text', sort: 'date-desc', filter: 'all' }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { density: 'text', sort: 'date-desc', filter: 'all' }
    return { density: 'text', sort: 'date-desc', filter: 'all', ...JSON.parse(raw) }
  } catch {
    return { density: 'text', sort: 'date-desc', filter: 'all' }
  }
}

function ToolbarChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors',
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
}

export default function TimelineView({ entries }: Props) {
  const [density, setDensity] = useState<TimelineDensity>('text')
  const [sort, setSort] = useState<TimelineSort>('date-desc')
  const [filter, setFilter] = useState<TimelineFilter>('all')
  const [showSort, setShowSort] = useState(false)

  useEffect(() => {
    const p = loadPrefs()
    setDensity(p.density)
    setSort(p.sort)
    setFilter(p.filter)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ density, sort, filter }))
  }, [density, sort, filter])

  const filtered = useMemo(
    () => sortEntries(filterEntries(entries, filter), sort),
    [entries, filter, sort],
  )

  const dotEntries = useMemo(
    () => entriesForDotStrip(filterEntries(entries, filter)),
    [entries, filter],
  )

  const byDate = useMemo(() => groupEntriesByDate(dotEntries), [dotEntries])

  if (!entries.length) {
    return (
      <Card className="py-12 text-center text-ink-3">
        Noch keine Einträge.
      </Card>
    )
  }

  return (
    <>
      <Card className="mb-3.5 space-y-3 p-4">
        <div className="flex items-center gap-2 text-ink-3">
          <SlidersHorizontal size={14} strokeWidth={1.75} aria-hidden />
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.06em]">
            Ansicht
          </span>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-ink-3">Größe</p>
          <div className="flex flex-wrap gap-1.5">
            {TIMELINE_DENSITY_OPTIONS.map(o => (
              <ToolbarChip
                key={o.id}
                active={density === o.id}
                onClick={() => setDensity(o.id)}
              >
                {o.label}
              </ToolbarChip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-ink-3">Filter</p>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TIMELINE_FILTER_OPTIONS.map(o => (
              <ToolbarChip
                key={o.id}
                active={filter === o.id}
                onClick={() => setFilter(o.id)}
              >
                {o.label}
              </ToolbarChip>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowSort(s => !s)}
            className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink"
          >
            <ArrowDownAZ size={14} strokeWidth={1.75} aria-hidden />
            Sortierung
            <span className="text-ink-2">
              · {TIMELINE_SORT_OPTIONS.find(o => o.id === sort)?.label}
            </span>
          </button>
          {showSort && (
            <div className="flex flex-wrap gap-1.5">
              {TIMELINE_SORT_OPTIONS.map(o => (
                <ToolbarChip
                  key={o.id}
                  active={sort === o.id}
                  onClick={() => {
                    setSort(o.id)
                    setShowSort(false)
                  }}
                >
                  {o.label}
                </ToolbarChip>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-ink-3">
          {filtered.length} von {entries.length} Einträgen
        </p>
      </Card>

      {filtered.length > 0 && (
        <Card className="mb-3.5 p-3">
          <div className="flex flex-col gap-1.5">
            {byDate.map(({ date, entries: dayEntries }) => {
              const label = new Date(date + 'T12:00:00').toLocaleDateString('de-DE', {
                day: 'numeric',
                month: 'short',
              })
              return (
                <div key={date} className="flex items-center gap-2">
                  <span className="w-9 shrink-0 text-[10px] text-ink-3">{label}</span>
                  <div className="flex flex-wrap gap-1">
                    {dayEntries.map(e => (
                      <div
                        key={e.id}
                        title={e.text.slice(0, 60)}
                        className="size-[11px] shrink-0 rounded-[3px]"
                        style={{
                          background: getValenceColor(e.grid_x),
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="py-10 text-center text-sm text-ink-3">
          Keine Einträge für diesen Filter.
        </Card>
      ) : density === 'full' ? (
        <div className="flex flex-col gap-2.5">
          {filtered.map(entry => (
            <TimelineCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <Card className="divide-y divide-edge overflow-hidden">
          {filtered.map(entry => (
            <div
              key={entry.id}
              className={cn(
                'px-4',
                density === 'text' ? 'py-2' : 'py-3',
              )}
            >
              {density === 'text' && (
                <EntryDisplay
                  entry={entry}
                  variant="text"
                  size="sm"
                  lines={2}
                  showDate
                />
              )}
              {density === 'compact' && (
                <EntryDisplay entry={entry} variant="compact" size="sm" lines={2} showDate />
              )}
              {density === 'chips' && (
                <EntryDisplay
                  entry={entry}
                  variant="chips-closed"
                  size="sm"
                  lines={2}
                  showDate
                />
              )}
            </div>
          ))}
        </Card>
      )}
    </>
  )
}
