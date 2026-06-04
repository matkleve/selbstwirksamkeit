import { parseEmbedding } from '@/lib/wgarmEc'
import { intensity, timespan, withStrongIntro } from '@/lib/insightText'
import type { MirrorCandidate } from '@/lib/patternDetection'
import type { Entry } from '@/lib/types'
import {
  avgGridX,
  pickDisplayEntries,
  signalFromCount,
  sortByDate,
  spanDays,
} from '@/lib/mirrorPatternHelpers'

const WEEKDAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    na += a[i]! * a[i]!
    nb += b[i]! * b[i]!
  }
  const d = Math.sqrt(na) * Math.sqrt(nb)
  return d === 0 ? 0 : dot / d
}

type EntryWithEmb = Entry & { embedding?: number[] | string | null }

function hourBucket(h: number): string {
  if (h >= 5 && h < 12) return 'Morgen'
  if (h >= 12 && h < 18) return 'Nachmittag'
  if (h >= 18 && h < 23) return 'Abend'
  return 'Nacht'
}

/** time_correlation — ≥10 entries total, Δ avg grid_x ≥ 0.3 */
export function detectTimeCorrelation(entries: Entry[]): MirrorCandidate | null {
  if (entries.length < 10) return null

  const buckets = new Map<string, Entry[]>()
  for (const e of entries) {
    const h = new Date(e.created_at).getHours()
    const key = hourBucket(h)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(e)
  }

  let best: { label: string; hits: Entry[]; delta: number } | null = null
  const overall = avgGridX(entries)

  for (const [label, hits] of buckets) {
    if (hits.length < 4) continue
    const bucketAvg = avgGridX(hits)
    const delta = bucketAvg - overall
    if (Math.abs(delta) < 0.3) continue
    if (!best || Math.abs(delta) > Math.abs(best.delta)) {
      best = { label, hits, delta }
    }
  }

  if (!best) return null

  const sorted = sortByDate(best.hits)
  const count = sorted.length
  const strength = signalFromCount(count)
  const adj = best.delta > 0 ? 'positiver' : 'schwerer'
  const since = new Date(sorted[0]!.created_at)

  return {
    entryIds: sorted.map(e => e.id),
    entries: pickDisplayEntries(sorted),
    source: 'time_correlation',
    signalStrength: strength,
    count,
    introText: withStrongIntro(
      strength,
      `Deine ${best.label}-Einträge klingen systematisch ${adj} als sonst.`,
    ),
    question: 'Überrascht dich das?',
    summaryText: `${timespan(spanDays(sorted), since)}, ${count}×.`,
  }
}

/** weekday_pattern — ≥3 entries on weekday, Δ ≥ 0.35 vs other days */
export function detectWeekdayPattern(entries: Entry[]): MirrorCandidate | null {
  if (entries.length < 8) return null

  const byDay = new Map<number, Entry[]>()
  for (const e of entries) {
    const d = new Date(e.created_at)
    const wd = d.getDay() === 0 ? 6 : d.getDay() - 1
    if (!byDay.has(wd)) byDay.set(wd, [])
    byDay.get(wd)!.push(e)
  }

  let best: { wd: number; hits: Entry[]; delta: number } | null = null
  const overall = avgGridX(entries)

  for (const [wd, hits] of byDay) {
    if (hits.length < 3) continue
    const dayAvg = avgGridX(hits)
    const delta = dayAvg - overall
    if (Math.abs(delta) < 0.35) continue
    if (!best || Math.abs(delta) > Math.abs(best.delta)) {
      best = { wd, hits, delta }
    }
  }

  if (!best) return null

  const sorted = sortByDate(best.hits)
  const count = sorted.length
  const strength = signalFromCount(count)
  const dayName = WEEKDAY_NAMES[best.wd]!
  const since = new Date(sorted[0]!.created_at)

  return {
    entryIds: sorted.map(e => e.id),
    entries: pickDisplayEntries(sorted),
    source: 'weekday_pattern',
    signalStrength: strength,
    count,
    introText: withStrongIntro(strength, `${dayName}s schreibst du anders als an anderen Tagen.`),
    question: `Was passiert an ${dayName}s?`,
    summaryText: `${timespan(spanDays(sorted), since)}, ${count}×.`,
  }
}

/** temporal_echo — embedding similarity ≥ 0.75, ≥ 21d apart */
export function detectTemporalEcho(entries: EntryWithEmb[]): MirrorCandidate | null {
  const withEmb = entries
    .map(e => ({ e, emb: parseEmbedding(e.embedding ?? null) }))
    .filter((x): x is { e: Entry; emb: number[] } => !!x.emb?.length)

  if (withEmb.length < 2) return null

  let bestPair: { old: Entry; recent: Entry; sim: number } | null = null

  for (let i = 0; i < withEmb.length; i++) {
    for (let j = i + 1; j < withEmb.length; j++) {
      const a = withEmb[i]!
      const b = withEmb[j]!
      const days = Math.abs(
        (new Date(a.e.created_at).getTime() - new Date(b.e.created_at).getTime()) / 86400000,
      )
      if (days < 21) continue
      const sim = cosineSimilarity(a.emb, b.emb)
      if (sim < 0.75) continue
      const [old, recent] =
        new Date(a.e.created_at) < new Date(b.e.created_at)
          ? [a.e, b.e]
          : [b.e, a.e]
      if (!bestPair || sim > bestPair.sim) {
        bestPair = { old, recent, sim }
      }
    }
  }

  if (!bestPair) return null

  const strength: MirrorCandidate['signalStrength'] =
    bestPair.sim >= 0.85 ? 'strong' : 'moderate'

  return {
    entryIds: [bestPair.old.id, bestPair.recent.id],
    entries: [bestPair.old, bestPair.recent],
    source: 'temporal_echo',
    signalStrength: strength,
    count: 2,
    introText: 'Du hast das schon einmal geschrieben.',
    question: 'Was hat sich seitdem verändert?',
  }
}
