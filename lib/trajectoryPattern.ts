import type { Entry } from '@/lib/types'
import { formatDateEuropean } from '@/lib/utils'
import { bilinearColor } from '@/lib/gridZones'

export type PatternPeriod = 'tag' | 'woche' | 'jahr' | 'kalender'
export type PatternFold = 'day' | 'week' | 'year'
export type PatternAxisMode = 'valence' | 'referenz' | 'both'

export interface PatternSlot {
  key: string
  label: string
}

export interface PatternPoint {
  slotIndex: number
  value: number | null
  avgGridX: number
  avgGridY: number
  count: number
}

export interface PatternSeries {
  id: string
  label: string
  opacity: number
  points: PatternPoint[]
}

const DAY_MS = 86400000

export const DAY_SLOTS: PatternSlot[] = [
  { key: 'morgen', label: 'Morgen' },
  { key: 'mittag', label: 'Mittag' },
  { key: 'abend', label: 'Abend' },
  { key: 'nacht', label: 'Nacht' },
]

export const WEEK_SLOTS: PatternSlot[] = [
  { key: 'mo', label: 'Montag' },
  { key: 'di', label: 'Dienstag' },
  { key: 'mi', label: 'Mittwoch' },
  { key: 'do', label: 'Donnerstag' },
  { key: 'fr', label: 'Freitag' },
  { key: 'sa', label: 'Samstag' },
  { key: 'so', label: 'Sonntag' },
]

export const SEASON_SLOTS: PatternSlot[] = [
  { key: 'fruehling', label: 'Frühling' },
  { key: 'sommer', label: 'Sommer' },
  { key: 'herbst', label: 'Herbst' },
  { key: 'winter', label: 'Winter' },
]

const WINDOWS: Record<Exclude<PatternPeriod, 'kalender'>, { days: number; maxEntries: number }> = {
  tag: { days: 30, maxEntries: 80 },
  woche: { days: 16 * 7, maxEntries: 120 },
  jahr: { days: 365 * 5, maxEntries: 200 },
}

const MAX_CUSTOM_ENTRIES = 200
const MAX_YEARS = 5

export function periodToFold(period: PatternPeriod, lastFold: PatternFold): PatternFold {
  if (period === 'tag') return 'day'
  if (period === 'woche') return 'week'
  if (period === 'jahr') return 'year'
  return lastFold
}

/** Short x-axis labels for the pattern chart */
export function slotShortLabel(slot: PatternSlot): string {
  const short: Record<string, string> = {
    morgen: 'Morg',
    mittag: 'Mitt',
    abend: 'Abend',
    nacht: 'Nacht',
    mo: 'Mo',
    di: 'Di',
    mi: 'Mi',
    do: 'Do',
    fr: 'Fr',
    sa: 'Sa',
    so: 'So',
    fruehling: 'Frühj',
    sommer: 'Som',
    herbst: 'Herb',
    winter: 'Win',
  }
  return short[slot.key] ?? slot.label
}

export function slotsForFold(fold: PatternFold): PatternSlot[] {
  if (fold === 'day') return DAY_SLOTS
  if (fold === 'week') return WEEK_SLOTS
  return SEASON_SLOTS
}

/** Stroke/fill from average Feld position of the series (multi-year lines). */
export function patternSeriesColor(s: PatternSeries): string {
  const pts = s.points.filter(p => p.count > 0)
  if (!pts.length) return 'var(--text-secondary)'
  const ax = pts.reduce((sum, p) => sum + p.avgGridX, 0) / pts.length
  const ay = pts.reduce((sum, p) => sum + p.avgGridY, 0) / pts.length
  const [r, g, b] = bilinearColor(ax, ay)
  return `rgb(${r},${g},${b})`
}

export function periodHint(period: PatternPeriod): string {
  switch (period) {
    case 'tag':
      return 'Letzte 30 Tage'
    case 'woche':
      return 'Letzte 16 Wochen'
    case 'jahr':
      return `Letzte ${MAX_YEARS} Jahre`
    case 'kalender':
      return 'Eigener Zeitraum'
  }
}

/** Hour → 0..3 (Morgen … Nacht) */
export function daySlotIndex(hour: number): number {
  if (hour >= 5 && hour < 11) return 0
  if (hour >= 11 && hour < 14) return 1
  if (hour >= 14 && hour < 21) return 2
  return 3
}

/** Monday = 0 … Sunday = 6 */
export function weekSlotIndex(d: Date): number {
  const js = d.getDay()
  return js === 0 ? 6 : js - 1
}

/** Meteorological season in DE */
export function seasonSlotIndex(month: number): number {
  if (month >= 2 && month <= 4) return 0
  if (month >= 5 && month <= 7) return 1
  if (month >= 8 && month <= 10) return 2
  return 3
}

function slotIndexForEntry(e: Entry, fold: PatternFold): number {
  const d = new Date(e.created_at)
  if (fold === 'day') return daySlotIndex(d.getHours())
  if (fold === 'week') return weekSlotIndex(d)
  return seasonSlotIndex(d.getMonth())
}

function valueForEntry(e: Entry, mode: PatternAxisMode): number {
  if (mode === 'referenz') return e.grid_y ?? 0
  return e.grid_x ?? 0
}

function eligible(e: Entry, mode: PatternAxisMode): boolean {
  if (e.grid_x === null) return false
  if (mode !== 'valence' && e.grid_y === null) return false
  return true
}

export function filterEntriesForPeriod(
  entries: Entry[],
  period: PatternPeriod,
  customFrom: string,
  customTo: string,
): Entry[] {
  const now = Date.now()
  let fromMs: number
  let toMs = now

  if (period === 'kalender') {
    fromMs = new Date(customFrom + 'T00:00:00').getTime()
    toMs = new Date(customTo + 'T23:59:59').getTime()
    if (Number.isNaN(fromMs)) fromMs = 0
    if (Number.isNaN(toMs)) toMs = now
    if (fromMs > toMs) [fromMs, toMs] = [toMs, fromMs]
  } else {
    const { days, maxEntries } = WINDOWS[period]
    fromMs = now - days * DAY_MS
    const filtered = entries
      .filter(e => {
        const t = new Date(e.created_at).getTime()
        return t >= fromMs && t <= toMs
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return filtered.slice(0, maxEntries).reverse()
  }

  const filtered = entries
    .filter(e => {
      const t = new Date(e.created_at).getTime()
      return t >= fromMs && t <= toMs
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return filtered.slice(0, MAX_CUSTOM_ENTRIES).reverse()
}

function slotHasData(p: PatternPoint): boolean {
  return p.count > 0 && p.value != null
}

/** Fill empty cyclic slots (e.g. Nacht) from the next period / next day phase so the line stays closed. */
function imputeCyclicPatternPoints(points: PatternPoint[]): PatternPoint[] {
  const n = points.length
  const result = points.map(p => ({ ...p }))
  if (!result.some(slotHasData)) return result

  for (let pass = 0; pass < n; pass++) {
    let changed = false
    for (let i = 0; i < n; i++) {
      if (slotHasData(result[i])) continue
      const prevIdx = (i - 1 + n) % n
      const nextIdx = (i + 1) % n
      const prev = slotHasData(result[prevIdx]) ? result[prevIdx] : null
      const next = slotHasData(result[nextIdx]) ? result[nextIdx] : null

      if (next && prev) {
        result[i] = {
          slotIndex: i,
          value: Math.round(((prev.value! + next.value!) / 2) * 10) / 10,
          avgGridX: Math.round(((prev.avgGridX + next.avgGridX) / 2) * 10) / 10,
          avgGridY: Math.round(((prev.avgGridY + next.avgGridY) / 2) * 10) / 10,
          count: 0,
        }
        changed = true
      } else if (next) {
        result[i] = { ...next, slotIndex: i, count: 0 }
        changed = true
      } else if (prev) {
        result[i] = { ...prev, slotIndex: i, count: 0 }
        changed = true
      }
    }
    if (!changed) break
  }
  return result
}

function applyCyclicImputation(points: PatternPoint[], fold: PatternFold): PatternPoint[] {
  if (fold === 'day' || fold === 'week') return imputeCyclicPatternPoints(points)
  return points
}

function aggregateSlot(
  bucket: Entry[],
  slotIndex: number,
  mode: PatternAxisMode,
): PatternPoint {
  if (!bucket.length) {
    return { slotIndex, value: null, avgGridX: 0, avgGridY: 0, count: 0 }
  }
  const avgGridX = bucket.reduce((s, e) => s + (e.grid_x ?? 0), 0) / bucket.length
  const avgGridY = bucket.reduce((s, e) => s + (e.grid_y ?? 0), 0) / bucket.length
  const value = bucket.reduce((s, e) => s + valueForEntry(e, mode), 0) / bucket.length
  return {
    slotIndex,
    value: Math.round(value * 10) / 10,
    avgGridX: Math.round(avgGridX * 10) / 10,
    avgGridY: Math.round(avgGridY * 10) / 10,
    count: bucket.length,
  }
}

function buildSingleSeries(
  entries: Entry[],
  fold: PatternFold,
  slots: PatternSlot[],
  mode: PatternAxisMode,
): PatternSeries {
  const buckets: Entry[][] = slots.map(() => [])
  for (const e of entries) {
    if (!eligible(e, mode)) continue
    buckets[slotIndexForEntry(e, fold)].push(e)
  }
  const points = applyCyclicImputation(
    buckets.map((b, i) => aggregateSlot(b, i, mode)),
    fold,
  )
  return {
    id: 'profile',
    label: 'Ø Zeitraum',
    opacity: 1,
    points,
  }
}

function buildYearSeries(
  entries: Entry[],
  slots: PatternSlot[],
  mode: PatternAxisMode,
): PatternSeries[] {
  const byYear = new Map<number, Entry[]>()
  for (const e of entries) {
    if (!eligible(e, mode)) continue
    const y = new Date(e.created_at).getFullYear()
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y)!.push(e)
  }

  const years = [...byYear.keys()].sort((a, b) => a - b).slice(-MAX_YEARS)
  const n = years.length

  return years.map((year, yi) => {
    const yearEntries = byYear.get(year)!
    const buckets: Entry[][] = slots.map(() => [])
    for (const e of yearEntries) {
      buckets[seasonSlotIndex(new Date(e.created_at).getMonth())].push(e)
    }
    const opacity = n <= 1 ? 1 : 0.22 + 0.78 * (yi / (n - 1))
    const points = buckets.map((b, i) => aggregateSlot(b, i, mode))
    return {
      id: String(year),
      label: String(year),
      opacity,
      points,
    }
  })
}

export function buildPatternChart(
  entries: Entry[],
  period: PatternPeriod,
  fold: PatternFold,
  mode: PatternAxisMode,
  customFrom: string,
  customTo: string,
): { series: PatternSeries[]; slots: PatternSlot[]; filteredCount: number } {
  const slots = slotsForFold(fold)
  const filtered = filterEntriesForPeriod(entries, period, customFrom, customTo)
  const eligibleEntries = filtered.filter(e => eligible(e, mode))

  const series =
    fold === 'year'
      ? buildYearSeries(eligibleEntries, slots, mode)
      : [buildSingleSeries(eligibleEntries, fold, slots, mode)]

  return { series, slots, filteredCount: eligibleEntries.length }
}

export function defaultCustomRange(entries: Entry[]): { from: string; to: string } {
  const to = new Date()
  const toStr = to.toISOString().slice(0, 10)
  const withCoords = entries.filter(e => e.grid_x !== null)
  if (!withCoords.length) return { from: toStr, to: toStr }
  const oldest = withCoords.reduce(
    (min, e) => (e.created_at.slice(0, 10) < min ? e.created_at.slice(0, 10) : min),
    withCoords[0].created_at.slice(0, 10),
  )
  return { from: oldest, to: toStr }
}

export function formatCustomRangeSubtitle(from: string, to: string): string {
  return `${formatDateEuropean(from)} – ${formatDateEuropean(to)}`
}
