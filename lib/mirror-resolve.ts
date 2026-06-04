import type { SupabaseClient } from '@supabase/supabase-js'
import { isMirrorDevMode } from '@/lib/mirror-config'
import {
  detectPattern,
  candidateFromStored,
  type MirrorCandidate,
} from '@/lib/patternDetection'
import type { Entry } from '@/lib/types'

async function persistCandidate(
  supabase: SupabaseClient,
  userId: string,
  candidate: MirrorCandidate,
): Promise<void> {
  await supabase.from('mirror_candidates').insert({
    user_id: userId,
    entry_ids: candidate.entryIds,
    source: candidate.source,
    signal_strength: candidate.signalStrength,
    intro_text: candidate.introText,
    question: candidate.question,
    shown: true,
    shown_at: new Date().toISOString(),
  })
}

export async function resolveMirrorCandidate(
  supabase: SupabaseClient,
  userId: string,
  entries: Entry[],
): Promise<MirrorCandidate | null> {
  if (isMirrorDevMode()) {
    const detected = detectPattern(entries)
    if (detected) await persistCandidate(supabase, userId, detected)
    return detected
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

  const detected = detectPattern(entries)
  if (detected) await persistCandidate(supabase, userId, detected)
  return detected
}
