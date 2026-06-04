import type { Entry } from './types'
import type { MirrorCandidate } from './patternDetection'

const RECENT_MS = 7 * 24 * 60 * 60 * 1000

export function sortByDate(entries: Entry[]): Entry[] {
  return [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

export function spanDays(entries: Entry[]): number {
  if (entries.length < 2) return 0
  const sorted = sortByDate(entries)
  return Math.round(
    (new Date(sorted[sorted.length - 1]!.created_at).getTime() -
      new Date(sorted[0]!.created_at).getTime()) /
      (24 * 60 * 60 * 1000),
  )
}

export function avgGridX(entries: Entry[]): number {
  const vals = entries.filter(e => e.grid_x !== null).map(e => e.grid_x!)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function avgIntervalDays(entries: Entry[]): number {
  if (entries.length < 2) return 0
  const dates = entries.map(e => new Date(e.created_at).getTime())
  const intervals: number[] = []
  for (let i = 1; i < dates.length; i++) {
    intervals.push((dates[i]! - dates[i - 1]!) / (24 * 60 * 60 * 1000))
  }
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
}

/** Prefer entries older than 7 days — recent week is context, not the insight. */
export function pickDisplayEntries(sorted: Entry[], max = 3): Entry[] {
  if (sorted.length <= max) return sorted

  const older = sorted.filter(e => Date.now() - new Date(e.created_at).getTime() > RECENT_MS)
  const pool = older.length >= max ? older : sorted

  if (pool.length <= max) return pool

  const mid = Math.floor((pool.length - 1) / 2)
  const indices = [...new Set([0, mid, pool.length - 1])].sort((a, b) => a - b)
  return indices.map(i => pool[i]!)
}

export function signalFromCount(count: number): MirrorCandidate['signalStrength'] {
  if (count >= 5) return 'strong'
  if (count >= 3) return 'moderate'
  return 'weak'
}

const STRENGTH_RANK = { strong: 3, moderate: 2, weak: 1 } as const

export function pickBestCandidate(candidates: (MirrorCandidate | null)[]): MirrorCandidate | null {
  const valid = candidates.filter((c): c is MirrorCandidate => c !== null)
  if (!valid.length) return null
  const nonWeak = valid.filter(c => c.signalStrength !== 'weak')
  const pool = nonWeak.length ? nonWeak : valid
  return [...pool].sort(
    (a, b) => STRENGTH_RANK[b.signalStrength] - STRENGTH_RANK[a.signalStrength],
  )[0]!
}
