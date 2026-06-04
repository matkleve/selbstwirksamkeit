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
  const { data: entryRows } = await supabase
    .from('entries')
    .select('*')
    .in('id', stored.entry_ids)

  if (!entryRows?.length) return null

  if (markShown) {
    await supabase
      .from('mirror_candidates')
      .update({ shown: true, shown_at: new Date().toISOString() })
      .eq('id', stored.id)
  }

  return candidateFromStored(stored, entryRows as Entry[])
}

async function resolveDevMode(
  supabase: SupabaseClient,
  userId: string,
  entries: EntryWithEmbedding[],
): Promise<MirrorCandidate | null> {
  const phase1 = detectPattern(entries)
  const { best: wgarmBest, bestValenceShift } = runWgarmForEntries(entries)

  const wgarmMirror = wgarmBest ? wgarmToMirrorCandidate(wgarmBest, entries) : null
  const valenceMirror = bestValenceShift ? valenceShiftToMirror(bestValenceShift, entries) : null
  const best = pickBestMirrorCandidate([phase1, wgarmMirror, valenceMirror])

  if (phase1) await persistPhase1Candidate(supabase, userId, phase1, true)
  if (wgarmBest) await persistWgarmCandidate(supabase, userId, wgarmBest, true)
  if (bestValenceShift) await persistValenceShiftCandidate(supabase, userId, bestValenceShift, true)

  return best
}

/** Production: strongest unshown pre-generated candidate only (no live fallback). */
async function fetchProductionCandidate(
  supabase: SupabaseClient,
): Promise<MirrorCandidate | null> {
  const { data: rows } = await supabase
    .from('mirror_candidates')
    .select('*')
    .eq('shown', false)
    .in('signal_strength', ['strong', 'moderate'])

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
