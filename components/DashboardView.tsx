'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import ValenceChartLazy from '@/components/ValenceChartLazy'
import CalendarHeatmap from '@/components/CalendarHeatmap'
import TimeOfDayBars from '@/components/TimeOfDayBars'
import { useEntries } from '@/components/EntriesProvider'
import type { BodyState } from '@/lib/types'
import type { CalDay } from '@/components/CalendarHeatmap'
import type { DayPeriod } from '@/components/TimeOfDayBars'
import type { ChartPoint } from '@/components/ValenceChart'

const card: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', padding: 20, marginBottom: 14 }
const lbl: React.CSSProperties = { fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }

export default function DashboardView() {
  const { entries } = useEntries()

  const {
    posCount,
    negCount,
    chartData,
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
    const posCount = thisWeek.filter(e => e.grid_x !== null && e.grid_x > 0).length
    const negCount = thisWeek.filter(e => e.grid_x !== null && e.grid_x < 0).length

    const now = new Date()
    const chartData: ChartPoint[] = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (13 - i))
      const ds = d.toDateString()
      const de = entries.filter(e => new Date(e.created_at).toDateString() === ds && e.grid_x !== null)
      const label = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })
      if (!de.length) return { label, value: null }
      const value = de.reduce((s, e) => s + (e.grid_x ?? 0), 0) / de.length
      const latest = de[de.length - 1]
      return { label, value, text: latest.text }
    })

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

    return { posCount, negCount, chartData, calWeeks, periodData, ge, qC, maxQ, bodyPatterns, latestEntries }
  }, [entries])

  if (entries.length === 0) {
    return (
      <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
        Noch keine Einträge.
      </div>
    )
  }

  return (
    <>
      <div style={card}>
        <p style={lbl}>Diese Woche</p>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: '2.25rem', fontFamily: 'var(--font-display)', color: 'var(--valence-pos-strong)', lineHeight: 1 }}>{posCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>positiv</div>
          </div>
          <div>
            <div style={{ fontSize: '2.25rem', fontFamily: 'var(--font-display)', color: 'var(--valence-neg-strong)', lineHeight: 1 }}>{negCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>schwierig</div>
          </div>
        </div>
      </div>

      {chartData.some(d => d.value !== null) && (
        <div style={card}>
          <p style={lbl}>Letzte 14 Tage</p>
          <ValenceChartLazy data={chartData} />
        </div>
      )}

      <div style={card}>
        <p style={lbl}>Kalender · 16 Wochen</p>
        <CalendarHeatmap weeks={calWeeks} />
      </div>

      <div style={card}>
        <p style={lbl}>Tageszeit</p>
        <TimeOfDayBars periods={periodData} />
      </div>

      {ge.length >= 5 && (
        <div style={card}>
          <p style={lbl}>Quadranten</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
            {[
              { key: 'neg-other' as const, label: 'neg / andere', color: 'var(--valence-neg-mid)' },
              { key: 'pos-other' as const, label: 'pos / andere', color: 'var(--valence-pos-mid)' },
              { key: 'neg-self' as const, label: 'neg / ich', color: 'var(--valence-neg-mid)' },
              { key: 'pos-self' as const, label: 'pos / ich', color: 'var(--valence-pos-mid)' },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>{label}</span><span>{qC[key]}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${(qC[key] / maxQ) * 100}%`, background: color, borderRadius: 3, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bodyPatterns.length > 0 && (
        <div style={card}>
          <p style={lbl}>Körper-Muster</p>
          {bodyPatterns.map((p, i) => (
            <p key={i} style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: 'var(--font-display)', lineHeight: 1.5, marginBottom: i < bodyPatterns.length - 1 ? 10 : 0 }}>
              💭 {p}
            </p>
          ))}
        </div>
      )}

      <div style={card}>
        <p style={lbl}>Letzte Einträge</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {latestEntries.map(entry => (
            <div key={entry.id} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ width: 3, height: 36, borderRadius: 2, flexShrink: 0, background: `var(--valence-${entry.grid_x !== null && entry.grid_x >= 3 ? 'pos-strong' : entry.grid_x !== null && entry.grid_x >= 1 ? 'pos-mid' : entry.grid_x !== null && entry.grid_x >= -1 ? 'neutral' : entry.grid_x !== null && entry.grid_x >= -3 ? 'neg-mid' : 'neg-strong'})`, marginTop: 2 }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {entry.text}
              </p>
            </div>
          ))}
        </div>
        <Link href="/timeline" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Alle Einträge →
        </Link>
      </div>
    </>
  )
}
