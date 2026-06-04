import type { SupabaseClient } from '@supabase/supabase-js'
import { isMirrorDevMode } from '@/lib/mirror-config'
import {
  detectPattern,
  candidateFromStored,
  type MirrorCandidate,
} from '@/lib/patternDetection'
import {
  runWgarmForEntries,
  wgarmToMirrorCandidate,
  valenceShiftToMirror,
  pickBestMirrorCandidate,
  persistWgarmCandidate,
  persistValenceShiftCandidate,
} from '@/lib/mirror-wgarm'
import type { Entry } from '@/lib/types'

type EntryWithEmbedding = Entry & { embedding?: number[] | string | null }

type StoredCandidate = {
  id: string
  entry_ids: string[]
  source: string
  signal_strength: string
  intro_text?: string | null
  question?: string | null
  template_text?: string | null
  pattern_metadata?: Record<string, unknown> | null
  created_at: string
}

function strengthRank(strength: string): number {
  return strength === 'strong' ? 0 : strength === 'moderate' ? 1 : 2
}

function pickBestUnshown(rows: StoredCandidate[]): StoredCandidate | null {
  if (!rows.length) return null
  return [...rows].sort((a, b) => {
    const sr = strengthRank(a.signal_strength) - strengthRank(b.signal_strength)
    if (sr !== 0) return sr
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })[0]!
}

function candidateFingerprint(source: string, entryIds: string[]): string {
  return `${source}:${[...entryIds].sort().join(',')}`
}

async function fetchShownFingerprints(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('mirror_candidates')
    .select('entry_ids, source')
    .eq('shown', true)

  if (error) throw new Error(error.message)

  return new Set(
    (data ?? []).map(row =>
      candidateFingerprint(row.source, (row.entry_ids ?? []) as string[]),
    ),
  )
}

function isCandidateAlreadyShown(candidate: MirrorCandidate, shown: Set<string>): boolean {
  return shown.has(candidateFingerprint(candidate.source, candidate.entryIds))
}

function sameMirrorCandidate(a: MirrorCandidate, b: MirrorCandidate | null): boolean {
  if (!b) return false
  return candidateFingerprint(a.source, a.entryIds) === candidateFingerprint(b.source, b.entryIds)
}

async function persistPhase1Candidate(
  supabase: SupabaseClient,
  userId: string,
  candidate: MirrorCandidate,
  shown: boolean,
): Promise<void> {
  await supabase.from('mirror_candidates').insert({
    user_id: userId,
    entry_ids: candidate.entryIds,
    source: candidate.source,
    signal_strength: candidate.signalStrength,
    intro_text: candidate.introText,
    question: candidate.question,
    shown,
    shown_at: shown ? new Date().toISOString() : null,
  })
}

async function candidateFromStoredRow(
  supabase: SupabaseClient,
  stored: StoredCandidate,
  markShown: boolean,
): Promise<MirrorCandidate | null> {
  const { data: entryRows, error: entriesError } = await supabase
    .from('entries')
    .select('*')
    .in('id', stored.entry_ids)

  if (entriesError) throw new Error(entriesError.message)
  if (!entryRows?.length) return null

  if (markShown) {
    const shownAt = new Date().toISOString()
    const targetFp = candidateFingerprint(stored.source, stored.entry_ids)

    const { data: unshown, error: listError } = await supabase
      .from('mirror_candidates')
      .select('id, entry_ids, source')
      .eq('shown', false)

    if (listError) throw new Error(listError.message)

    const ids = (unshown ?? [])
      .filter(row => candidateFingerprint(row.source, (row.entry_ids ?? []) as string[]) === targetFp)
      .map(row => row.id)

    if (ids.length) {
      const { error: updateError } = await supabase
        .from('mirror_candidates')
        .update({ shown: true, shown_at: shownAt })
        .in('id', ids)
      if (updateError) throw new Error(updateError.message)
    }
  }

  return candidateFromStored(stored, entryRows as Entry[])
}

async function resolveDevMode(
  supabase: SupabaseClient,
  userId: string,
  entries: EntryWithEmbedding[],
): Promise<MirrorCandidate | null> {
  const shown = await fetchShownFingerprints(supabase)

  const phase1 = detectPattern(entries)
  const { best: wgarmBest, bestValenceShift } = runWgarmForEntries(entries)

  const wgarmMirror = wgarmBest ? wgarmToMirrorCandidate(wgarmBest, entries) : null
  const valenceMirror = bestValenceShift ? valenceShiftToMirror(bestValenceShift, entries) : null

  const pool = [phase1, wgarmMirror, valenceMirror].filter(
    (c): c is MirrorCandidate => c !== null && !isCandidateAlreadyShown(c, shown),
  )
  const best = pickBestMirrorCandidate(pool)

  if (!best) return null

  if (sameMirrorCandidate(best, phase1) && phase1) {
    await persistPhase1Candidate(supabase, userId, phase1, true)
  } else if (sameMirrorCandidate(best, wgarmMirror) && wgarmBest) {
    await persistWgarmCandidate(supabase, userId, wgarmBest, true)
  } else if (sameMirrorCandidate(best, valenceMirror) && bestValenceShift) {
    await persistValenceShiftCandidate(supabase, userId, bestValenceShift, true)
  }

  return best
}

/** Production: strongest unshown pre-generated candidate only (no live fallback). */
async function fetchProductionCandidate(
  supabase: SupabaseClient,
): Promise<MirrorCandidate | null> {
  const { data: rows, error } = await supabase
    .from('mirror_candidates')
    .select('*')
    .eq('shown', false)
    .in('signal_strength', ['strong', 'moderate'])

  if (error) throw new Error(error.message)

  const stored = pickBestUnshown((rows ?? []) as StoredCandidate[])
  if (!stored) return null

  return candidateFromStoredRow(supabase, stored, true)
}

export async function fetchNextMirrorCandidate(
  supabase: SupabaseClient,
  userId: string,
  entries: EntryWithEmbedding[],
): Promise<MirrorCandidate | null> {
  if (isMirrorDevMode()) {
    return resolveDevMode(supabase, userId, entries)
  }
  return fetchProductionCandidate(supabase)
}

/** @deprecated Use fetchNextMirrorCandidate on explicit user open. */
export async function resolveMirrorCandidate(
  supabase: SupabaseClient,
  userId: string,
  entries: EntryWithEmbedding[],
): Promise<MirrorCandidate | null> {
  return fetchNextMirrorCandidate(supabase, userId, entries)
}
