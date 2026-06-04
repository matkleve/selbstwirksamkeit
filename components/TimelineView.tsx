'use client'

import { useEffect, useMemo, useState } from 'react'
import TimelineCard from '@/components/TimelineCard'
import { TimelineToolbar } from '@/components/TimelineToolbar'
import { useEntries } from '@/components/EntriesProvider'
import { EntryDisplay } from '@/components/entry'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import {
  filterEntries,
  sortEntries,
  type TimelineDensity,
  type TimelineFilter,
  type TimelineSort,
} from '@/lib/timelineView'
import {
  filterEntriesByDateRange,
  formatRangeLabel,
  timelineBounds,
  type TimelineDateRange,
} from '@/lib/timelineRange'
import { TimelineRangeSlider } from '@/components/TimelineRangeSlider'

const STORAGE_KEY = 'selbstwirksamkeit-timeline-view'

interface StoredPrefs {
  density: TimelineDensity
  sort: TimelineSort
  filter: TimelineFilter
  rangeStart?: string
  rangeEnd?: string
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

export default function TimelineView() {
  const { entries: entriesAsc } = useEntries()
  const entries = useMemo(
    () => [...entriesAsc].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [entriesAsc],
  )

  const [density, setDensity] = useState<TimelineDensity>('text')
  const [sort, setSort] = useState<TimelineSort>('date-desc')
  const [filter, setFilter] = useState<TimelineFilter>('all')
  const [openMenu, setOpenMenu] = useState<'density' | 'filter' | 'sort' | null>(null)
  const [dateRange, setDateRange] = useState<TimelineDateRange | null>(null)
  const [rangeReady, setRangeReady] = useState(false)

  const bounds = useMemo(() => timelineBounds(entriesAsc), [entriesAsc])

  useEffect(() => {
    const p = loadPrefs()
    setDensity(p.density)
    setSort(p.sort)
    setFilter(p.filter)
    if (p.rangeStart && p.rangeEnd) {
      setDateRange({ start: p.rangeStart, end: p.rangeEnd })
    }
    setRangeReady(true)
  }, [])

  useEffect(() => {
    if (!bounds || dateRange || !rangeReady) return
    setDateRange(bounds)
  }, [bounds, dateRange, rangeReady])

  useEffect(() => {
    if (!rangeReady) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        density,
        sort,
        filter,
        rangeStart: dateRange?.start,
        rangeEnd: dateRange?.end,
      }),
    )
  }, [density, sort, filter, dateRange, rangeReady])

  const rangeActive =
    !!dateRange &&
    !!bounds &&
    (dateRange.start !== bounds.start || dateRange.end !== bounds.end)

  const filtered = useMemo(() => {
    const byMeta = filterEntries(entries, filter)
    return sortEntries(filterEntriesByDateRange(byMeta, dateRange), sort)
  }, [entries, filter, sort, dateRange])

  const sliderEntries = useMemo(
    () => filterEntries(entries, filter),
    [entries, filter],
  )

  if (!entries.length) {
    return (
      <>
        <PageHeader
          title="Verlauf"
          description="Alle deine Einträge — durchsuchbar und filterbar nach Kategorie."
        />
        <Card className="py-12 text-center text-ink-3">
          Noch keine Einträge.
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Verlauf"
        description="Alle deine Einträge — durchsuchbar und filterbar nach Kategorie."
      />
      <TimelineToolbar
        density={density}
        filter={filter}
        sort={sort}
        onDensityChange={setDensity}
        onFilterChange={setFilter}
        onSortChange={setSort}
        openMenu={openMenu}
        onOpenMenu={setOpenMenu}
        summary={`${filtered.length} Einträge${rangeActive && dateRange ? ` · ${formatRangeLabel(dateRange)}` : ' · gesamter Verlauf'}`}
      />

      {entries.length > 0 && bounds && dateRange && (
        <Card className="mb-3.5 space-y-2 p-4">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-ink-3">
            Zeitraum
          </p>
          <TimelineRangeSlider
            entries={sliderEntries}
            bounds={bounds}
            range={dateRange}
            onRangeChange={setDateRange}
          />
          {(dateRange.start !== bounds.start || dateRange.end !== bounds.end) && (
            <button
              type="button"
              onClick={() => setDateRange(bounds)}
              className="text-xs text-ink-3 underline-offset-2 hover:text-ink hover:underline"
            >
              Gesamten Zeitraum anzeigen
            </button>
          )}
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="py-10 text-center text-sm text-ink-3">
          Keine Einträge für diesen Filter oder Zeitraum.
        </Card>
      ) : (
        <>
          {density === 'full' ? (
            <div className="grid grid-cols-2 gap-2.5">
              {filtered.map(entry => (
                <TimelineCard key={entry.id} entry={entry} className="min-w-0" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(entry => (
                <div key={entry.id} className="min-w-0">
                  {density === 'text' && (
                    <EntryDisplay
                      entry={entry}
                      variant="text"
                      size="sm"
                      lines={2}
                      showDate
                      className="min-w-0"
                    />
                  )}
                  {density === 'compact' && (
                    <EntryDisplay
                      entry={entry}
                      variant="compact"
                      size="sm"
                      lines={2}
                      showDate
                      className="min-w-0"
                    />
                  )}
                  {density === 'chips' && (
                    <EntryDisplay
                      entry={entry}
                      variant="chips-closed"
                      size="sm"
                      lines={2}
                      showDate
                      className="min-w-0"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
