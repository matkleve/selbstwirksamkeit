import type { Entry } from '@/lib/types'

export type TimelineDensity = 'text' | 'compact' | 'chips' | 'full'

export type TimelineSort =
  | 'date-desc'
  | 'date-asc'
  | 'valence-desc'
  | 'valence-asc'

export type TimelineFilter =
  | 'all'
  | 'positive'
  | 'negative'
  | 'has-person'
  | 'has-location'
  | 'has-activity'

export const TIMELINE_DENSITY_OPTIONS: { id: TimelineDensity; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'compact', label: 'Kompakt' },
  { id: 'chips', label: 'Chips' },
  { id: 'full', label: 'Voll' },
]

export const TIMELINE_SORT_OPTIONS: { id: TimelineSort; label: string }[] = [
  { id: 'date-desc', label: 'Neueste zuerst' },
  { id: 'date-asc', label: 'Älteste zuerst' },
  { id: 'valence-desc', label: 'Valenz hoch' },
  { id: 'valence-asc', label: 'Valenz tief' },
]

export const TIMELINE_FILTER_OPTIONS: { id: TimelineFilter; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'positive', label: '+ Valenz' },
  { id: 'negative', label: '− Valenz' },
  { id: 'has-person', label: 'Person' },
  { id: 'has-location', label: 'Ort' },
  { id: 'has-activity', label: 'Tätigkeit' },
]

export function filterEntries(entries: Entry[], filter: TimelineFilter): Entry[] {
  switch (filter) {
    case 'positive':
      return entries.filter(e => e.grid_x !== null && e.grid_x > 0)
    case 'negative':
      return entries.filter(e => e.grid_x !== null && e.grid_x < 0)
    case 'has-person':
      return entries.filter(e => e.person?.trim())
    case 'has-location':
      return entries.filter(e => e.location?.trim())
    case 'has-activity':
      return entries.filter(e => e.activity?.trim())
    default:
      return entries
  }
}

export function sortEntries(entries: Entry[], sort: TimelineSort): Entry[] {
  const copy = [...entries]
  copy.sort((a, b) => {
    switch (sort) {
      case 'date-asc':
        return a.created_at.localeCompare(b.created_at)
      case 'valence-desc': {
        const ax = a.grid_x ?? -999
        const bx = b.grid_x ?? -999
        return bx - ax || b.created_at.localeCompare(a.created_at)
      }
      case 'valence-asc': {
        const ax = a.grid_x ?? 999
        const bx = b.grid_x ?? 999
        return ax - bx || b.created_at.localeCompare(a.created_at)
      }
      default:
        return b.created_at.localeCompare(a.created_at)
    }
  })
  return copy
}

export function groupEntriesByDate(entries: Entry[]): { date: string; entries: Entry[] }[] {
  const map = new Map<string, Entry[]>()
  for (const e of entries) {
    const d = e.created_at.slice(0, 10)
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(e)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({ date, entries: list }))
}

/** For dot strip — same order as list when sorted by date desc within day */
export function entriesForDotStrip(entries: Entry[]): Entry[] {
  return sortEntries(entries, 'date-desc')
}
