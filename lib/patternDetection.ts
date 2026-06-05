import { atomicMetaValues, metaTagKey } from './entryMeta'
import { metaLabelsFromAntecedent, regenerateInsightText } from './wgarmEc'
import {
  intensity,
  timespan,
  withStrongIntro,
} from './insightText'
import {
  avgGridX,
  avgIntervalDays,
  pickBestCandidate,
  pickDisplayEntries,
  signalFromCount,
  sortByDate,
  spanDays,
} from './mirrorPatternHelpers'
import {
  detectTemporalEcho,
  detectTimeCorrelation,
  detectWeekdayPattern,
} from './mirrorDetectorsExtended'
import type { Entry } from './types'

export type MirrorSource =
  | 'tag_frequency'
  | 'grid_cluster'
  | 'wgarm_ec'
  | 'valence_shift'
  | 'time_correlation'
  | 'weekday_pattern'
  | 'temporal_echo'

export interface MirrorCandidate {
  entryIds: string[]
  entries: Entry[]
  source: MirrorSource
  signalStrength: 'weak' | 'moderate' | 'strong'
  count: number
  /** Pattern text before entries (empty when entriesFirst). */
  introText: string
  /** After entries, before question (Wiederholung). */
  summaryText?: string
  /** Pattern text after entries (wgarm, valence_shift). */
  closingText?: string
  /** Entries before pattern copy (Zusammenhang). */
  entriesFirst?: boolean
  question: string
  relevantMeta?: string[]
}

const BODY_STATE_LABELS: Record<string, string> = {
  stressed: 'gestresst',
  calm: 'ruhig',
  tired: 'müde',
}

const QUADRANT_LABELS: Record<string, string> = {
  px_py: 'positiv und anderen zugewandt',
  px_ny: 'positiv und auf dich bezogen',
  nx_py: 'schwer in Bezug auf andere',
  nx_ny: 'schwer und auf dich gerichtet',
}

function relevantMetaFromField(field: keyof Entry, raw: string): string[] {
  return atomicMetaValues(
    field as 'person' | 'location' | 'activity' | 'body_state',
    raw,
  )
}

function tagLabel(field: keyof Entry, val: string): string {
  if (field === 'body_state') return BODY_STATE_LABELS[val] ?? val
  if (field === 'person') return `mit ${val}`
  if (field === 'location') return `am ${val}`
  if (field === 'activity') return `beim ${val}`
  return val
}

function bareLabel(field: keyof Entry, raw: string): string {
  if (field === 'body_state') return BODY_STATE_LABELS[raw] ?? raw
  if (field === 'person') return raw
  if (field === 'location') return raw
  if (field === 'activity') return raw
  return raw
}

export function detectTagFrequency(entries: Entry[]): MirrorCandidate | null {
  const buckets = new Map<
    string,
    { field: keyof Entry; raw: string; label: string; hits: Entry[] }
  >()

  for (const e of entries) {
    const fields: (keyof Entry)[] = ['person', 'location', 'activity', 'body_state']
    for (const field of fields) {
      const val = e[field] as string | null
      if (!val) continue
      const atomics = atomicMetaValues(
        field as 'person' | 'location' | 'activity' | 'body_state',
        val,
      )
      for (const atomic of atomics) {
        const key =
          field === 'body_state' ? `${field}:${atomic}` : `${field}:${metaTagKey(atomic)}`
        if (!buckets.has(key)) {
          buckets.set(key, { field, raw: atomic, label: tagLabel(field, atomic), hits: [] })
        }
        buckets.get(key)!.hits.push(e)
      }
    }
  }

  let best: { field: keyof Entry; raw: string; label: string; hits: Entry[] } | null = null
  for (const b of buckets.values()) {
    if (b.hits.length >= 3 && (!best || b.hits.length > best.hits.length)) {
      best = b
    }
  }

  if (!best) return null

  const sorted = sortByDate(best.hits)
  if (spanDays(sorted) < 14) return null

  const count = sorted.length
  const strength = signalFromCount(count)
  const since = new Date(sorted[0]!.created_at)
  const span = spanDays(sorted)
  const valence = avgGridX(sorted)

  let introText: string
  let summaryText: string
  let question: string

  if (valence > 0.3) {
    introText = withStrongIntro(
      strength,
      `Deine Einträge ${best.label} klingen meist positiv — ${intensity(count)} ${timespan(span, since)}.`,
    )
    summaryText = `Du hast das ${count}× erlebt.`
    question = 'Fällt dir auf, was diese Momente verbindet?'
  } else if (valence < -0.3) {
    introText = withStrongIntro(
      strength,
      `Deine Einträge ${best.label} klingen meist schwer — ${intensity(count)} ${timespan(span, since)}.`,
    )
    summaryText = `Das ist ${count}× aufgetaucht.`
    question = 'Fällt dir auf, was diese Momente verbindet?'
  } else {
    const interval = avgIntervalDays(sorted)
    const label = bareLabel(best.field, best.raw)
    introText = `In deinen Einträgen erscheint ${label} immer wieder — alle ~${interval || '?'} Tage.`
    summaryText = `${timespan(span, since)}, ${count}×.`
    question = 'Was bedeutet das für dich?'
  }

  return {
    entryIds: sorted.map(e => e.id),
    entries: pickDisplayEntries(sorted),
    source: 'tag_frequency',
    signalStrength: strength,
    count,
    introText,
    summaryText,
    question,
    relevantMeta: relevantMetaFromField(best.field, best.raw),
  }
}

export function detectGridCluster(entries: Entry[]): MirrorCandidate | null {
  const buckets = new Map<string, Entry[]>()
  for (const e of entries) {
    if (e.grid_x === null || e.grid_y === null) continue
    const key = `${e.grid_x >= 0 ? 'p' : 'n'}x_${e.grid_y >= 0 ? 'p' : 'n'}y`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(e)
  }

  const ranked = [...buckets.entries()].sort((a, b) => b[1].length - a[1].length)
  const [bestKey, bestHits] = ranked[0] ?? ['', []]
  const secondCount = ranked[1]?.[1].length ?? 0

  if (bestHits.length < 5) return null
  if (secondCount > 0 && bestHits.length < secondCount * 1.5) return null

  const sorted = sortByDate(bestHits)
  if (spanDays(sorted) < 14) return null

  const count = sorted.length
  const strength = signalFromCount(count)
  const label = QUADRANT_LABELS[bestKey] ?? 'ähnlich'
  const since = new Date(sorted[0]!.created_at)
  const span = spanDays(sorted)

  return {
    entryIds: sorted.map(e => e.id),
    entries: pickDisplayEntries(sorted),
    source: 'grid_cluster',
    signalStrength: strength,
    count,
    introText: withStrongIntro(
      strength,
      `Du kehrst immer wieder zu Momenten zurück, die sich ${label} anfühlen.`,
    ),
    summaryText: `${timespan(span, since)}, ${count}×.`,
    question: 'Was verbindet diese Momente?',
  }
}

export function detectPattern(entries: Entry[]): MirrorCandidate | null {
  return pickBestCandidate([
    detectTagFrequency(entries),
    detectGridCluster(entries),
    detectTimeCorrelation(entries),
    detectTemporalEcho(entries),
    detectWeekdayPattern(entries),
  ])
}

export function detectAllPhase1(entries: Entry[]): MirrorCandidate[] {
  const out: MirrorCandidate[] = []
  for (const c of [
    detectTagFrequency(entries),
    detectGridCluster(entries),
    detectTimeCorrelation(entries),
    detectTemporalEcho(entries),
    detectWeekdayPattern(entries),
  ]) {
    if (c) out.push(c)
  }
  return out
}

export function valenceShiftToMirrorCandidate(
  stored: {
    entry_ids: string[]
    signal_strength: string
    template_text: string
    question: string
    pattern_metadata: {
      entry_early: string
      entry_late: string
      entry_middle?: string
      shift?: number
      occurrence_count?: number
      span_days?: number
    }
  },
  entries: Entry[],
): MirrorCandidate | null {
  const byId = new Map(entries.map(e => [e.id, e]))
  const meta = stored.pattern_metadata
  const early = byId.get(meta.entry_early)
  const late = byId.get(meta.entry_late)
  if (!early || !late) return null

  const n = meta.occurrence_count ?? stored.entry_ids.length
  const clusterEntries = stored.entry_ids
    .map(id => byId.get(id))
    .filter((e): e is Entry => !!e)
  const span = meta.span_days ?? spanDays(clusterEntries)
  const shift = meta.shift ?? 0
  const strength = stored.signal_strength as MirrorCandidate['signalStrength']
  const extended = n >= 6 && span >= 60

  let displayEntries: Entry[]
  if (extended) {
    const sorted = sortByDate(
      stored.entry_ids.map(id => byId.get(id)).filter((e): e is Entry => !!e),
    )
    const mid = sorted[Math.floor(sorted.length / 2)]!
    displayEntries = [sorted[0]!, mid, sorted[sorted.length - 1]!]
  } else {
    displayEntries = [early, late]
  }

  const positive = shift > 0
  const introText = positive
    ? 'Früher klang das so:'
    : 'In ähnlichen Momenten klang das früher so:'
  const closingText = positive
    ? withStrongIntro(strength, 'Etwas hat sich verändert.')
    : undefined
  const question = positive
    ? stored.question || 'Was war das?'
    : stored.question || 'Was ist passiert?'

  return {
    entryIds: stored.entry_ids,
    entries: displayEntries,
    source: 'valence_shift',
    signalStrength: strength,
    count: n,
    introText,
    closingText,
    question,
  }
}

export function candidateFromStored(
  stored: {
    entry_ids: string[]
    source: string
    signal_strength: string
    intro_text?: string | null
    question?: string | null
    template_text?: string | null
    pattern_metadata?: Record<string, unknown> | null
  },
  entries: Entry[],
): MirrorCandidate {
  const sorted = sortByDate(entries)

  if (stored.template_text && stored.source === 'valence_shift' && stored.pattern_metadata) {
    const vs = valenceShiftToMirrorCandidate(
      {
        entry_ids: stored.entry_ids,
        signal_strength: stored.signal_strength,
        template_text: stored.template_text,
        question: stored.question ?? 'Was hat sich verändert?',
        pattern_metadata: stored.pattern_metadata as {
          entry_early: string
          entry_late: string
          occurrence_count?: number
          span_days?: number
          shift?: number
        },
      },
      entries,
    )
    if (vs) return vs
  }

  if (stored.template_text && stored.source === 'wgarm_ec') {
    const antecedent = stored.pattern_metadata?.antecedent
    const anchorIds = (stored.pattern_metadata?.anchor_entry_ids as string[] | undefined) ?? []
    const byId = new Map(entries.map(e => [e.id, e]))
    const display =
      anchorIds.length > 0
        ? anchorIds.map(id => byId.get(id)).filter((e): e is Entry => !!e)
        : pickDisplayEntries(sorted)

    let closingText = stored.template_text
    const storedMeta = stored.pattern_metadata
    if (Array.isArray(antecedent) && Array.isArray(storedMeta?.consequent)) {
      const regen = regenerateInsightText({
        antecedent: antecedent as string[],
        consequent: storedMeta!.consequent as string[],
        confidence: (storedMeta!.confidence as number) ?? 0,
        is_escalating: (storedMeta!.is_escalating as boolean) ?? false,
      })
      if (regen) closingText = regen
    }

    return {
      entryIds: stored.entry_ids,
      entries: display.length ? display : pickDisplayEntries(sorted),
      source: 'wgarm_ec',
      signalStrength: stored.signal_strength as MirrorCandidate['signalStrength'],
      count: sorted.length,
      introText: '',
      closingText,
      entriesFirst: true,
      question: stored.question ?? 'Erkennst du das?',
      relevantMeta: Array.isArray(antecedent)
        ? metaLabelsFromAntecedent(antecedent as string[])
        : undefined,
    }
  }

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
