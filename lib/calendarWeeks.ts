import type { Entry } from '@/lib/types'
import type { CalDay } from '@/components/CalendarHeatmap'

function mondayOnOrBefore(d: Date): Date {
  const m = new Date(d)
  m.setHours(12, 0, 0, 0)
  const dow = m.getDay()
  const back = dow === 0 ? 6 : dow - 1
  m.setDate(m.getDate() - back)
  return m
}

function thisWeekMonday(now = new Date()): Date {
  return mondayOnOrBefore(now)
}

/** Weeks from the start of the oldest entry's month through the current week. */
export function buildCalendarWeeks(entries: Entry[]): CalDay[][] {
  const endMonday = thisWeekMonday()
  const MIN_WEEKS = 12

  let startMonday: Date
  if (!entries.length) {
    startMonday = new Date(endMonday)
    startMonday.setDate(endMonday.getDate() - (MIN_WEEKS - 1) * 7)
  } else {
    const oldestStr = entries.reduce(
      (min, e) => (e.created_at.slice(0, 10) < min ? e.created_at.slice(0, 10) : min),
      entries[0].created_at.slice(0, 10),
    )
    const oldest = new Date(oldestStr + 'T12:00:00')
    const monthStart = new Date(oldest.getFullYear(), oldest.getMonth(), 1, 12)
    startMonday = mondayOnOrBefore(monthStart)
  }

  const weekCount = Math.max(
    MIN_WEEKS,
    Math.floor((endMonday.getTime() - startMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
  )

  const calDays: CalDay[] = Array.from({ length: weekCount * 7 }, (_, i) => {
    const d = new Date(startMonday)
    d.setDate(startMonday.getDate() + i)
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${mo}-${day}`
    const de = entries.filter(e => e.created_at.slice(0, 10) === dateStr && e.grid_x !== null)
    return {
      dateStr,
      count: de.length,
      avgValence: de.length ? de.reduce((s, e) => s + (e.grid_x ?? 0), 0) / de.length : null,
    }
  })

  return Array.from({ length: weekCount }, (_, w) => calDays.slice(w * 7, w * 7 + 7))
}
