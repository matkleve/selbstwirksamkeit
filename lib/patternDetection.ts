import type { Entry } from './types'

export type MirrorSource = 'tag_frequency' | 'grid_cluster' | 'wgarm_ec' | 'embedding_temporal'

export interface MirrorCandidate {
  entryIds: string[]
  entries: Entry[]
  source: MirrorSource
  signalStrength: 'weak' | 'moderate' | 'strong'
  count: number
  introText: string
  question: string
}

const RECENT_MS = 7 * 24 * 60 * 60 * 1000

function sortByDate(entries: Entry[]): Entry[] {
  return [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

function avgIntervalDays(entries: Entry[]): number {
  if (entries.length < 2) return 0
  const dates = entries.map(e => new Date(e.created_at).getTime())
  const intervals: number[] = []
  for (let i = 1; i < dates.length; i++) {
    intervals.push((dates[i] - dates[i - 1]) / (24 * 60 * 60 * 1000))
  }
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
}

function formatSince(first: Date): string {
  const month = first.toLocaleDateString('de-DE', { month: 'long' })
  const year = first.getFullYear()
  return year === new Date().getFullYear() ? `seit ${month}` : `seit ${month} ${year}`
}

/** Prefer entries older than 7 days — recent week is context, not the insight. */
function pickDisplayEntries(sorted: Entry[], max = 3): Entry[] {
  if (sorted.length <= max) return sorted

  const older = sorted.filter(e => Date.now() - new Date(e.created_at).getTime() > RECENT_MS)
  const pool = older.length >= max ? older : sorted

  if (pool.length <= max) return pool

  const mid = Math.floor((pool.length - 1) / 2)
  const indices = [...new Set([0, mid, pool.length - 1])].sort((a, b) => a - b)
  return indices.map(i => pool[i])
}

function temporalIntro(label: string, sorted: Entry[]): string {
  const count = sorted.length
  const interval = avgIntervalDays(sorted)
  const since = formatSince(new Date(sorted[0].created_at))
  const intervalPart = interval > 0 ? `alle ~${interval} Tage` : 'wiederholt'
  return `„${label}" kommt ${intervalPart} vor — ${count}× ${since}.`
}

export function detectTagFrequency(entries: Entry[]): MirrorCandidate | null {
  const buckets = new Map<string, { label: string; hits: Entry[] }>()

  for (const e of entries) {
    const fields: [keyof Entry, string][] = [
      ['person', 'mit'],
      ['location', 'bei'],
      ['activity', 'beim'],
      ['body_state', ''],
    ]
    for (const [field, prep] of fields) {
      const val = e[field] as string | null
      if (!val) continue
      const key = `${field}:${val}`
      if (!buckets.has(key)) {
        const label = field === 'body_state' ? val : `${prep} ${val}`.trim()
        buckets.set(key, { label, hits: [] })
      }
      buckets.get(key)!.hits.push(e)
    }
  }

  let best: { label: string; hits: Entry[] } | null = null
  for (const b of buckets.values()) {
    if (b.hits.length >= 3 && (!best || b.hits.length > best.hits.length)) {
      best = b
    }
  }

  if (!best) return null

  const sorted = sortByDate(best.hits)
  const count = sorted.length
  const display = pickDisplayEntries(sorted)

  return {
    entryIds: sorted.map(e => e.id),
    entries: display,
    source: 'tag_frequency',
    signalStrength: count >= 5 ? 'strong' : 'moderate',
    count,
    introText: temporalIntro(best.label, sorted),
    question: 'Was verbindest du mit diesen Momenten?',
  }
}

export function detectGridCluster(entries: Entry[]): MirrorCandidate | null {
  const QUADRANT_LABELS: Record<string, string> = {
    px_py: 'positiv, auf andere bezogen',
    px_ny: 'positiv, auf dich bezogen',
    nx_py: 'schwer, auf andere bezogen',
    nx_ny: 'schwer, auf dich bezogen',
  }

  const buckets = new Map<string, Entry[]>()
  for (const e of entries) {
    if (e.grid_x === null || e.grid_y === null) continue
    const key = `${e.grid_x >= 0 ? 'p' : 'n'}x_${e.grid_y >= 0 ? 'p' : 'n'}y`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(e)
  }

  let bestKey = ''
  let bestHits: Entry[] = []
  for (const [key, hits] of buckets) {
    if (hits.length >= 3 && hits.length > bestHits.length) {
      bestKey = key
      bestHits = hits
    }
  }

  if (!bestHits.length) return null

  const sorted = sortByDate(bestHits)
  const count = sorted.length
  const label = QUADRANT_LABELS[bestKey] ?? 'ähnlichen Bereich'
  const interval = avgIntervalDays(sorted)
  const since = formatSince(new Date(sorted[0].created_at))
  const intervalPart = interval > 0 ? `alle ~${interval} Tage` : 'wiederholt'

  return {
    entryIds: sorted.map(e => e.id),
    entries: pickDisplayEntries(sorted),
    source: 'grid_cluster',
    signalStrength: count >= 5 ? 'strong' : 'moderate',
    count,
    introText: `${count} Einträge lagen im Bereich ${label} — ${intervalPart}, ${since}.`,
    question: 'Was haben diese Momente gemeinsam?',
  }
}

export function detectPattern(entries: Entry[]): MirrorCandidate | null {
  return detectTagFrequency(entries) ?? detectGridCluster(entries)
}

/** All Phase-1 candidates (tag + grid), both may be present. */
export function detectAllPhase1(entries: Entry[]): MirrorCandidate[] {
  const out: MirrorCandidate[] = []
  const tag = detectTagFrequency(entries)
  const grid = detectGridCluster(entries)
  if (tag) out.push(tag)
  if (grid) out.push(grid)
  return out
}

export function candidateFromStored(
  stored: {
    entry_ids: string[]
    source: string
    signal_strength: string
    intro_text?: string | null
    question?: string | null
    template_text?: string | null
  },
  entries: Entry[],
): MirrorCandidate {
  const sorted = sortByDate(entries)

  if (stored.template_text) {
    return {
      entryIds: stored.entry_ids,
      entries: pickDisplayEntries(sorted),
      source: stored.source as MirrorSource,
      signalStrength: stored.signal_strength as MirrorCandidate['signalStrength'],
      count: sorted.length,
      introText: stored.template_text,
      question: stored.question ?? 'Was fällt dir daran auf?',
    }
  }

  return {
    entryIds: stored.entry_ids,
    entries: pickDisplayEntries(sorted),
    source: stored.source as MirrorSource,
    signalStrength: stored.signal_strength as MirrorCandidate['signalStrength'],
    count: sorted.length,
    introText: stored.intro_text ?? '',
    question: stored.question ?? '',
  }
}
