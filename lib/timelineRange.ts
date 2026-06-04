import type { Entry } from '@/lib/types'

/** Inclusive YYYY-MM-DD bounds. */
export interface TimelineDateRange {
  start: string
  end: string
}

export function toDateKey(iso: string): string {
  return iso.slice(0, 10)
}

export function todayDateKey(): string {
  return new Date().toLocaleDateString('en-CA')
}

export function isToday(dateKey: string): boolean {
  return toDateKey(dateKey) === todayDateKey()
}

export function daysBetween(start: string, end: string): number {
  const a = new Date(start + 'T12:00:00').getTime()
  const b = new Date(end + 'T12:00:00').getTime()
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

export function addDays(date: string, delta: number): string {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

export function clampDate(date: string, min: string, max: string): string {
  if (date < min) return min
  if (date > max) return max
  return date
}

export function timelineBounds(entries: Entry[]): TimelineDateRange | null {
  if (!entries.length) return null
  const keys = entries.map(e => toDateKey(e.created_at))
  const start = keys.reduce((a, b) => (a < b ? a : b))
  const end = todayDateKey()
  return { start, end: end >= start ? end : start }
}

export function dateToRatio(date: string, bounds: TimelineDateRange): number {
  const span = daysBetween(bounds.start, bounds.end)
  if (span === 0) return 0.5
  return daysBetween(bounds.start, date) / span
}

export function ratioToDate(ratio: number, bounds: TimelineDateRange): string {
  const span = daysBetween(bounds.start, bounds.end)
  const offset = Math.round(Math.max(0, Math.min(1, ratio)) * span)
  return addDays(bounds.start, offset)
}

export function normalizeRange(start: string, end: string): TimelineDateRange {
  return start <= end ? { start, end } : { start: end, end: start }
}

/** Click: activate a window centered on the clicked day. */
export function rangeAroundDate(
  center: string,
  bounds: TimelineDateRange,
): TimelineDateRange {
  const span = daysBetween(bounds.start, bounds.end)
  const half = Math.max(3, Math.min(14, Math.round(span * 0.08)))
  const start = clampDate(addDays(center, -half), bounds.start, bounds.end)
  const end = clampDate(addDays(center, half), bounds.start, bounds.end)
  return normalizeRange(start, end)
}

export function filterEntriesByDateRange(
  entries: Entry[],
  range: TimelineDateRange | null,
): Entry[] {
  if (!range) return entries
  return entries.filter(e => {
    const d = toDateKey(e.created_at)
    return d >= range.start && d <= range.end
  })
}

export function groupEntriesByDayKeys(entries: Entry[]): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>()
  for (const e of entries) {
    const d = toDateKey(e.created_at)
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(e)
  }
  return map
}

export function formatRangeLabel(range: TimelineDateRange): string {
  const fmt = (d: string) => {
    if (isToday(d)) return 'Heute'
    return new Date(d + 'T12:00:00').toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: range.start.slice(0, 4) !== range.end.slice(0, 4) ? 'numeric' : undefined,
    })
  }
  if (range.start === range.end) return fmt(range.start)
  return `${fmt(range.start)} – ${fmt(range.end)}`
}

export function formatSliderEndLabel(dateKey: string): string {
  if (isToday(dateKey)) return 'Heute'
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
  })
}
