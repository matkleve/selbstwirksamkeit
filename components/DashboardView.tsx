'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import TrajectoryPatternCard from '@/components/TrajectoryPatternCard'
import CalendarHeatmap from '@/components/CalendarHeatmap'
import { buildCalendarWeeks } from '@/lib/calendarWeeks'
import TimeOfDayBars from '@/components/TimeOfDayBars'
import WeekPositiveSpotlight from '@/components/WeekPositiveSpotlight'
import { Card } from '@/components/ui/card'
import { useEntries } from '@/components/EntriesProvider'
import type { BodyState } from '@/lib/types'
import type { DayPeriod } from '@/components/TimeOfDayBars'
import { cn } from '@/lib/cn'
import { EntryDisplay } from '@/components/entry'
import { PageHeader } from '@/components/PageHeader'

const QUADRANT_META = [
  { key: 'neg-other' as const, label: '− / andere', bar: 'bg-v-neg-mid' },
  { key: 'pos-other' as const, label: '+ / andere', bar: 'bg-v-pos-mid' },
  { key: 'neg-self' as const, label: '− / ich', bar: 'bg-v-neg-mid' },
  { key: 'pos-self' as const, label: '+ / ich', bar: 'bg-v-pos-mid' },
]

export default function DashboardView() {
  const { entries } = useEntries()

  const {
    weekCount,
    weekDays,
    weekQC,
    maxWeekQ,
    weekPositive,
    calWeeks,
    periodData,
    bodyPatterns,
    latestEntries,
  } = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thisWeek = entries.filter(e => new Date(e.created_at) >= weekAgo)
    const weekCount = thisWeek.length
    const weekDays = new Set(thisWeek.map(e => e.created_at.slice(0, 10))).size

    const weekQC = { 'pos-other': 0, 'pos-self': 0, 'neg-other': 0, 'neg-self': 0 }
    thisWeek.forEach(e => {
      if (e.grid_x === null || e.grid_y === null) return
      if (e.grid_x >= 0 && e.grid_y >= 0) weekQC['pos-other']++
      else if (e.grid_x >= 0) weekQC['pos-self']++
      else if (e.grid_y >= 0) weekQC['neg-other']++
      else weekQC['neg-self']++
    })
    const maxWeekQ = Math.max(...Object.values(weekQC), 1)

    const weekPositive = thisWeek.filter(
      e => e.grid_x !== null && e.grid_y !== null && e.grid_x >= 0,
    )

    const calWeeks = buildCalendarWeeks(entries)

    const periodData: DayPeriod[] = [
      { label: 'Morgen', sublabel: '6–11 Uhr', start: 6, end: 11 },
      { label: 'Mittag', sublabel: '12–16 Uhr', start: 12, end: 16 },
      { label: 'Abend', sublabel: '17–22 Uhr', start: 17, end: 22 },
    ].map(({ label, sublabel, start, end }) => {
      const pe = entries.filter(e => { const h = new Date(e.created_at).getHours(); return h >= start && h <= end })
      const wv = pe.filter(e => e.grid_x !== null)
      return { label, sublabel, count: pe.length, avgValence: wv.length ? wv.reduce((s, e) => s + (e.grid_x ?? 0), 0) / wv.length : null }
    })

    const bodyGroups = (['stressed', 'calm', 'tired'] as BodyState[]).map(state => {
      const g = entries.filter(e => e.body_state === state && e.grid_x !== null)
      return { state, avg: g.length ? g.reduce((s, e) => s + (e.grid_x ?? 0), 0) / g.length : null, count: g.length }
    }).filter(g => g.count >= 3)
    const stateLabel = (s: BodyState) => s === 'stressed' ? 'gestresst' : s === 'calm' ? 'ruhig' : 'müde'
    const bodyPatterns: string[] = []
    for (let i = 0; i < bodyGroups.length; i++) {
      for (let j = i + 1; j < bodyGroups.length; j++) {
        if (Math.abs(bodyGroups[i].avg! - bodyGroups[j].avg!) >= 2) {
          const [lo, hi] = bodyGroups[i].avg! < bodyGroups[j].avg! ? [bodyGroups[i], bodyGroups[j]] : [bodyGroups[j], bodyGroups[i]]
          bodyPatterns.push(`Wenn du ${stateLabel(lo.state)} bist: Ø ${lo.avg!.toFixed(1)}. ${stateLabel(hi.state).charAt(0).toUpperCase() + stateLabel(hi.state).slice(1)}: Ø +${hi.avg!.toFixed(1)}.`)
        }
      }
    }

    const latestEntries = [...entries].reverse().slice(0, 3)

    return {
      weekCount,
      weekDays,
      weekQC,
      maxWeekQ,
      weekPositive,
      calWeeks,
      periodData,
      bodyPatterns,
      latestEntries,
    }
  }, [entries])

  if (entries.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Überblick über deine Woche, deine Einträge und wiederkehrende Muster."
        />
        <Card className="py-10 text-center text-ink-3">
          Noch keine Einträge.
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Überblick über deine Woche, deine Einträge und wiederkehrende Muster."
      />
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
      <Card className="min-w-0 p-5">
        <p className="section-label">Diese Woche</p>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-4xl leading-none text-ink">{weekCount}</span>
          <span className="text-sm text-ink-2">
            {weekCount === 1 ? 'Eintrag' : 'Einträge'}
            {weekDays > 0 && (
              <> · {weekDays} {weekDays === 1 ? 'Tag' : 'Tage'} mit Spur</>
            )}
          </span>
        </div>
        {weekCount > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2.5">
            {QUADRANT_META.map(({ key, label, bar }) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs text-ink-3">
                  <span>{label}</span>
                  <span>{weekQC[key]}</span>
                </div>
                <div className="h-1.5 rounded-sm bg-subtle">
                  <div
                    className={cn('h-full rounded-sm opacity-70', bar)}
                    style={{ width: `${(weekQC[key] / maxWeekQ) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {weekPositive.length > 0 && <WeekPositiveSpotlight entries={weekPositive} />}
      </Card>

      <Card className="min-w-0 p-5">
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <p className="section-label mb-0">Letzte Einträge</p>
          <Link
            href="/timeline"
            className="shrink-0 text-sm text-[var(--valence-pos-strong)] underline underline-offset-[3px] transition-colors hover:text-[var(--mirror-gold)]"
          >
            Alle Einträge →
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {latestEntries.map(entry => (
            <EntryDisplay key={entry.id} entry={entry} variant="text" size="sm" lines={2} />
          ))}
        </div>
      </Card>

      <TrajectoryPatternCard entries={entries} className="min-w-0" />

      <Card className="min-w-0 p-5">
        <p className="section-label">Kalender</p>
        <CalendarHeatmap weeks={calWeeks} />
      </Card>

      <Card className="min-w-0 p-5">
        <p className="section-label">Tageszeit</p>
        <TimeOfDayBars periods={periodData} />
      </Card>

      {bodyPatterns.length > 0 && (
        <Card className="min-w-0 p-5">
          <p className="section-label">Körper-Muster</p>
          {bodyPatterns.map((p, i) => (
            <p
              key={i}
              className={cn(
                'font-display text-[0.9375rem] italic leading-snug text-ink-2',
                i < bodyPatterns.length - 1 && 'mb-2.5',
              )}
            >
              💭 {p}
            </p>
          ))}
        </Card>
      )}
    </div>
    </>
  )
}
