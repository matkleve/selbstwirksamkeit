import type { MirrorCandidate } from '@/lib/patternDetection'

export function patternTextFromCandidate(candidate: MirrorCandidate): string {
  const parts = [candidate.introText, candidate.summaryText, candidate.closingText, candidate.question]
    .map(s => s?.trim())
    .filter(Boolean)
  return parts[0] ?? candidate.question
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
