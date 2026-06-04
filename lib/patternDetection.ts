import type { Entry } from './types'

export type MirrorSource = 'tag_frequency' | 'grid_cluster'

export interface MirrorCandidate {
  entryIds: string[]
  entries: Entry[]
  source: MirrorSource
  signalStrength: 'weak' | 'moderate' | 'strong'
  count: number
  introText: string
  question: string
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export function detectTagFrequency(entries: Entry[]): MirrorCandidate | null {
  const cutoff = new Date(Date.now() - SEVEN_DAYS)
  const recent = entries.filter(e => new Date(e.created_at) >= cutoff)

  const buckets = new Map<string, { label: string; hits: Entry[] }>()

  for (const e of recent) {
    const fields: [keyof Entry, string][] = [
      ['person',     'mit'],
      ['location',   'bei'],
      ['activity',   'beim'],
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

  const sorted = [...best.hits].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const count = sorted.length

  return {
    entryIds: sorted.map(e => e.id),
    entries: sorted.slice(0, 3),
    source: 'tag_frequency',
    signalStrength: count >= 5 ? 'strong' : 'moderate',
    count,
    introText: `In den letzten 7 Tagen tauchte „${best.label}" ${count}× auf.`,
    question: 'Was verbindest du mit diesen Momenten?',
  }
}

export function detectGridCluster(entries: Entry[]): MirrorCandidate | null {
  const cutoff = new Date(Date.now() - SEVEN_DAYS)
  const recent = entries.filter(
    e => new Date(e.created_at) >= cutoff && e.grid_x !== null && e.grid_y !== null
  )

  const QUADRANT_LABELS: Record<string, string> = {
    'px_py': 'positiv, auf andere bezogen',
    'px_ny': 'positiv, auf dich bezogen',
    'nx_py': 'schwer, auf andere bezogen',
    'nx_ny': 'schwer, auf dich bezogen',
  }

  const buckets = new Map<string, Entry[]>()
  for (const e of recent) {
    const key = `${(e.grid_x ?? 0) >= 0 ? 'p' : 'n'}x_${(e.grid_y ?? 0) >= 0 ? 'p' : 'n'}y`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(e)
  }

  let bestKey = ''
  let bestHits: Entry[] = []
  for (const [key, hits] of buckets) {
    if (hits.length >= 3 && hits.length > bestHits.length) {
      bestKey = key; bestHits = hits
    }
  }

  if (!bestHits.length) return null

  const sorted = [...bestHits].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const count = sorted.length
  const label = QUADRANT_LABELS[bestKey] ?? 'ähnlichen Bereich'

  return {
    entryIds: sorted.map(e => e.id),
    entries: sorted.slice(0, 3),
    source: 'grid_cluster',
    signalStrength: count >= 5 ? 'strong' : 'moderate',
    count,
    introText: `${count} Einträge in 7 Tagen lagen im selben Bereich: ${label}.`,
    question: 'Was haben diese Momente gemeinsam?',
  }
}
