import type { SupabaseClient } from '@supabase/supabase-js'
import {
  runWgarmEc,
  toWgarmEntry,
  pickBestWgarmCandidate,
  pickBestValenceShift,
  metaLabelsFromAntecedent,
  type WgarmMirrorCandidate,
  type ValenceShiftCandidate,
} from '@/lib/wgarmEc'
import { valenceShiftToMirrorCandidate, type MirrorCandidate } from '@/lib/patternDetection'
import type { Entry } from '@/lib/types'

type EntryWithEmbedding = Entry & { embedding?: number[] | string | null }

export function entriesToWgarm(entries: EntryWithEmbedding[]) {
  return entries.map(toWgarmEntry).filter((e): e is NonNullable<ReturnType<typeof toWgarmEntry>> => e !== null)
}

export function wgarmToMirrorCandidate(
  wgarm: WgarmMirrorCandidate,
  allEntries: Entry[],
): MirrorCandidate {
  const byId = new Map(allEntries.map(e => [e.id, e]))
  const anchorIds = wgarm.pattern_metadata.anchor_entry_ids.length
    ? wgarm.pattern_metadata.anchor_entry_ids
    : wgarm.entry_ids.slice(0, 3)
  const display = anchorIds.map(id => byId.get(id)).filter((e): e is Entry => !!e)

  return {
    entryIds: wgarm.entry_ids,
    entries: display.length ? display : allEntries.slice(0, 3),
    source: 'wgarm_ec',
    signalStrength: wgarm.signal_strength,
    count: wgarm.pattern_metadata.occurrence_count,
    introText: wgarm.template_text,
    question: 'Was fällt dir daran auf?',
    relevantMeta: metaLabelsFromAntecedent(wgarm.pattern_metadata.antecedent),
  }
}

const STRENGTH_RANK = { strong: 3, moderate: 2, weak: 1 } as const
const SOURCE_RANK: Record<string, number> = {
  wgarm_ec: 10,
  valence_shift: 9,
  tag_frequency: 5,
  grid_cluster: 4,
  embedding_temporal: 3,
}

export function pickBestMirrorCandidate(
  candidates: (MirrorCandidate | null)[],
): MirrorCandidate | null {
  const valid = candidates.filter((c): c is MirrorCandidate => c !== null)
  if (!valid.length) return null
  return [...valid].sort((a, b) => {
    const sd = STRENGTH_RANK[b.signalStrength] - STRENGTH_RANK[a.signalStrength]
    if (sd !== 0) return sd
    return (SOURCE_RANK[b.source] ?? 0) - (SOURCE_RANK[a.source] ?? 0)
  })[0]!
}

export function valenceShiftToMirror(
  shift: ValenceShiftCandidate,
  allEntries: Entry[],
): MirrorCandidate | null {
  return valenceShiftToMirrorCandidate(shift, allEntries)
}

export function runWgarmForEntries(entries: EntryWithEmbedding[]) {
  const wgarmEntries = entriesToWgarm(entries)
  if (wgarmEntries.length < 10) {
    return {
      result: null,
      best: null as WgarmMirrorCandidate | null,
      bestValenceShift: null as ValenceShiftCandidate | null,
    }
  }
  const result = runWgarmEc(wgarmEntries)
  const best =
    pickBestWgarmCandidate(result.mirror_candidates.filter(c => c.signal_strength !== 'weak')) ??
    pickBestWgarmCandidate(result.mirror_candidates)
  const bestValenceShift = pickBestValenceShift(result.valence_shift_candidates)
  return { result, best, bestValenceShift }
}

export async function persistValenceShiftCandidate(
  supabase: SupabaseClient,
  userId: string,
  shift: ValenceShiftCandidate,
  shown: boolean,
): Promise<void> {
  await supabase.from('mirror_candidates').insert({
    user_id: userId,
    entry_ids: shift.entry_ids,
    source: 'valence_shift',
    signal_strength: shift.signal_strength,
    template_text: shift.template_text,
    question: shift.question,
    pattern_metadata: shift.pattern_metadata,
    shown,
    shown_at: shown ? new Date().toISOString() : null,
  })
}

export async function persistWgarmCandidate(
  supabase: SupabaseClient,
  userId: string,
  wgarm: WgarmMirrorCandidate,
  shown: boolean,
): Promise<void> {
  await supabase.from('mirror_candidates').insert({
    user_id: userId,
    entry_ids: wgarm.entry_ids,
    source: 'wgarm_ec',
    signal_strength: wgarm.signal_strength,
    template_text: wgarm.template_text,
    question: 'Was fällt dir daran auf?',
    pattern_metadata: wgarm.pattern_metadata,
    shown,
    shown_at: shown ? new Date().toISOString() : null,
  })
}

/** Weekly job: persist top moderate+ candidates (max 3, deduped by template). */
export async function persistWgarmWeeklyCandidates(
  supabase: SupabaseClient,
  userId: string,
  candidates: WgarmMirrorCandidate[],
): Promise<number> {
  const ranked = candidates
    .filter(c => c.signal_strength !== 'weak')
    .sort((a, b) => {
      const sd = STRENGTH_RANK[b.signal_strength] - STRENGTH_RANK[a.signal_strength]
      if (sd !== 0) return sd
      return b.pattern_metadata.lift - a.pattern_metadata.lift
    })

  const seen = new Set<string>()
  let inserted = 0
  for (const c of ranked) {
    if (seen.has(c.template_text) || inserted >= 3) continue
    seen.add(c.template_text)
    await persistWgarmCandidate(supabase, userId, c, false)
    inserted++
  }
  return inserted
}
