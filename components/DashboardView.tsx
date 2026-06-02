'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import TrajectoryCard from '@/components/TrajectoryCard'
import CalendarHeatmap from '@/components/CalendarHeatmap'
import TimeOfDayBars from '@/components/TimeOfDayBars'
import { Card } from '@/components/ui/card'
import { useEntries } from '@/components/EntriesProvider'
import type { BodyState } from '@/lib/types'
import type { CalDay } from '@/components/CalendarHeatmap'
import type { DayPeriod } from '@/components/TimeOfDayBars'
import { cn } from '@/lib/cn'

const sectionLabel = 'mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-ink-3'

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
    calWeeks,
    periodData,
    ge,
    qC,
    maxQ,
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

    const now = new Date()
    const todayDow = now.getDay()
    const daysToMonday = todayDow === 0 ? 6 : todayDow - 1
    const thisMonday = new Date(now)
    thisMonday.setDate(now.getDate() - daysToMonday)
    thisMonday.setHours(0, 0, 0, 0)
    const calStart = new Date(thisMonday)
    calStart.setDate(thisMonday.getDate() - 15 * 7)

    const calDays: CalDay[] = Array.from({ length: 16 * 7 }, (_, i) => {
      const d = new Date(calStart)
      d.setDate(calStart.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const de = entries.filter(e => e.created_at.slice(0, 10) === dateStr && e.grid_x !== null)
      return {
        dateStr,
        count: de.length,
        avgValence: de.length ? de.reduce((s, e) => s + (e.grid_x ?? 0), 0) / de.length : null,
      }
    })
    const calWeeks: CalDay[][] = Array.from({ length: 16 }, (_, w) => calDays.slice(w * 7, w * 7 + 7))

    const periodData: DayPeriod[] = [
      { label: 'Morgen', sublabel: '6–11 Uhr', start: 6, end: 11 },
      { label: 'Mittag', sublabel: '12–16 Uhr', start: 12, end: 16 },
      { label: 'Abend', sublabel: '17–22 Uhr', start: 17, end: 22 },
    ].map(({ label, sublabel, start, end }) => {
      const pe = entries.filter(e => { const h = new Date(e.created_at).getHours(); return h >= start && h <= end })
      const wv = pe.filter(e => e.grid_x !== null)
      return { label, sublabel, count: pe.length, avgValence: wv.length ? wv.reduce((s, e) => s + (e.grid_x ?? 0), 0) / wv.length : null }
    })

    const ge = entries.filter(e => e.grid_x !== null && e.grid_y !== null)
    const qC = { 'pos-other': 0, 'pos-self': 0, 'neg-other': 0, 'neg-self': 0 }
    ge.forEach(e => {
      if (e.grid_x! >= 0 && e.grid_y! >= 0) qC['pos-other']++
      else if (e.grid_x! >= 0) qC['pos-self']++
      else if (e.grid_y! >= 0) qC['neg-other']++
      else qC['neg-self']++
    })
    const maxQ = Math.max(...Object.values(qC), 1)

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

    return { weekCount, weekDays, weekQC, maxWeekQ, calWeeks, periodData, ge, qC, maxQ, bodyPatterns, latestEntries }
  }, [entries])

  if (entries.length === 0) {
    return (
      <Card className="mb-3.5 py-10 text-center text-ink-3">
        Noch keine Einträge.
      </Card>
    )
  }

  return (
    <>
      <Card className="mb-3.5 p-5">
        <p className={sectionLabel}>Diese Woche</p>
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
      </Card>

      <TrajectoryCard entries={entries} />

      <Card className="mb-3.5 p-5">
        <p className={sectionLabel}>Kalender · 16 Wochen</p>
        <CalendarHeatmap weeks={calWeeks} />
      </Card>

      <Card className="mb-3.5 p-5">
        <p className={sectionLabel}>Tageszeit</p>
        <TimeOfDayBars periods={periodData} />
      </Card>

      {ge.length >= 5 && (
        <Card className="mb-3.5 p-5">
          <p className={sectionLabel}>Quadranten</p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
            {QUADRANT_META.map(({ key, label, bar }) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs text-ink-3">
                  <span>{label}</span>
                  <span>{qC[key]}</span>
                </div>
                <div className="h-1.5 rounded-sm bg-subtle">
                  <div
                    className={cn('h-full rounded-sm opacity-70', bar)}
                    style={{ width: `${(qC[key] / maxQ) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {bodyPatterns.length > 0 && (
        <Card className="mb-3.5 p-5">
          <p className={sectionLabel}>Körper-Muster</p>
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

      <Card className="mb-3.5 p-5">
        <p className={sectionLabel}>Letzte Einträge</p>
        <div className="mb-3.5 flex flex-col gap-2">
          {latestEntries.map(entry => (
            <div
              key={entry.id}
              className="flex items-start gap-2.5 border-b border-edge py-2 last:border-b-0"
            >
              <div
                className="mt-0.5 h-9 w-0.5 shrink-0 rounded-sm"
                style={{ background: `var(--valence-${entry.grid_x !== null && entry.grid_x >= 3 ? 'pos-strong' : entry.grid_x !== null && entry.grid_x >= 1 ? 'pos-mid' : entry.grid_x !== null && entry.grid_x >= -1 ? 'neutral' : entry.grid_x !== null && entry.grid_x >= -3 ? 'neg-mid' : 'neg-strong'})` }}
              />
              <p className="m-0 line-clamp-2 text-sm leading-snug text-ink-2">
                {entry.text}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/timeline"
          className="text-sm text-ink-2 underline underline-offset-[3px] hover:text-ink"
        >
          Alle Einträge →
        </Link>
      </Card>
    </>
  )
}
