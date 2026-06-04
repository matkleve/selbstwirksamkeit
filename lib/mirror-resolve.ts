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
  pickBestMirrorCandidate,
  persistWgarmCandidate,
} from '@/lib/mirror-wgarm'
import type { Entry } from '@/lib/types'

type EntryWithEmbedding = Entry & { embedding?: number[] | string | null }

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

async function resolveDevMode(
  supabase: SupabaseClient,
  userId: string,
  entries: EntryWithEmbedding[],
): Promise<MirrorCandidate | null> {
  const phase1 = detectPattern(entries)
  const { best: wgarmBest } = runWgarmForEntries(entries)

  const wgarmMirror = wgarmBest ? wgarmToMirrorCandidate(wgarmBest, entries) : null
  const best = pickBestMirrorCandidate([phase1, wgarmMirror])

  if (phase1) await persistPhase1Candidate(supabase, userId, phase1, true)
  if (wgarmBest) await persistWgarmCandidate(supabase, userId, wgarmBest, true)

  return best
}

export async function resolveMirrorCandidate(
  supabase: SupabaseClient,
  userId: string,
  entries: EntryWithEmbedding[],
): Promise<MirrorCandidate | null> {
  if (isMirrorDevMode()) {
    return resolveDevMode(supabase, userId, entries)
  }

  const { data: stored } = await supabase
    .from('mirror_candidates')
    .select('*')
    .eq('shown', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (stored) {
    const { data: entryRows } = await supabase
      .from('entries')
      .select('*')
      .in('id', stored.entry_ids as string[])

    if (entryRows?.length) {
      await supabase
        .from('mirror_candidates')
        .update({ shown: true, shown_at: new Date().toISOString() })
        .eq('id', stored.id)

      return candidateFromStored(stored, entryRows as Entry[])
    }
  }

  const phase1 = detectPattern(entries)
  if (phase1) await persistPhase1Candidate(supabase, userId, phase1, true)
  return phase1
}
