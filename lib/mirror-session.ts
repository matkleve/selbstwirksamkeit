import type { SupabaseClient } from '@supabase/supabase-js'
import { ENTRY_SELECT } from '@/lib/entry-fields'
import type { MirrorCandidate } from '@/lib/patternDetection'
import type { Entry } from '@/lib/types'

export function patternTextFromCandidate(candidate: MirrorCandidate): string {
  const parts = [candidate.introText, candidate.summaryText, candidate.closingText, candidate.question]
    .map(s => s?.trim())
    .filter(Boolean)
  return parts[0] ?? candidate.question
}

export const MIRROR_SESSION_SELECT =
  'id, created_at, pattern_type, pattern_text, anchor_entry_ids, user_response, intention_wenn, intention_dann, is_favorited, signal_strength'

export async function fetchMirrorHistory(supabase: SupabaseClient): Promise<{
  sessions: MirrorSessionRow[]
  entriesById: Record<string, Entry>
}> {
  const { data: sessions } = await supabase
    .from('mirror_sessions')
    .select(MIRROR_SESSION_SELECT)
    .order('is_favorited', { ascending: false })
    .order('created_at', { ascending: false })

  const sessionRows = (sessions ?? []) as MirrorSessionRow[]
  const anchorIds = [...new Set(sessionRows.flatMap(s => s.anchor_entry_ids ?? []))]

  if (!anchorIds.length) {
    return { sessions: sessionRows, entriesById: {} }
  }

  const { data: entryRows } = await supabase
    .from('entries')
    .select(ENTRY_SELECT)
    .in('id', anchorIds)

  const entriesById = Object.fromEntries((entryRows ?? []).map(e => [e.id, e as Entry]))
  return { sessions: sessionRows, entriesById }
}

export type MirrorSessionRow = {
  id: string
  created_at: string
  pattern_type: string | null
  pattern_text: string | null
  anchor_entry_ids: string[] | null
  user_response: string | null
  intention_wenn: string | null
  intention_dann: string | null
  is_favorited: boolean
  signal_strength: string | null
}
