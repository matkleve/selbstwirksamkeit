import type { MirrorCandidate } from '@/lib/patternDetection'
import { mirrorTransitionText } from '@/lib/mirrorTransition'
import type { NarrativeBlock } from '@/components/mirror/MirrorFlow.types'

export const MIRROR_EMPTY_TEXT =
  'Gerade sehe ich nichts Klares — das ist völlig okay.'

function addEntriesWithTransitions(
  blocks: NarrativeBlock[],
  entries: MirrorCandidate['entries'],
  skipTransitions = false,
) {
  entries.forEach((entry, i) => {
    blocks.push({ id: `entry-${i}`, type: 'entry', entry })
    const next = entries[i + 1]
    if (next && !skipTransitions) {
      blocks.push({
        id: `transition-${i}`,
        type: 'transition',
        text: mirrorTransitionText(entry.created_at, next.created_at),
      })
    }
  })
}

export function buildNarrativeBlocks(candidate: MirrorCandidate | null): NarrativeBlock[] {
  if (!candidate) {
    return [{ id: 'empty', type: 'text', text: MIRROR_EMPTY_TEXT, muted: true }]
  }

  const blocks: NarrativeBlock[] = []
  const skipTransitions = candidate.source === 'temporal_echo'

  if (candidate.entriesFirst) {
    addEntriesWithTransitions(blocks, candidate.entries, skipTransitions)
    if (candidate.closingText) {
      blocks.push({ id: 'closing', type: 'text', text: candidate.closingText })
    }
  } else if (candidate.source === 'valence_shift') {
    if (candidate.introText) {
      blocks.push({ id: 'intro', type: 'text', text: candidate.introText })
    }
    addEntriesWithTransitions(blocks, candidate.entries)
    if (candidate.closingText) {
      blocks.push({ id: 'closing', type: 'text', text: candidate.closingText })
    }
  } else {
    if (candidate.introText) {
      blocks.push({ id: 'intro', type: 'text', text: candidate.introText })
    }
    addEntriesWithTransitions(blocks, candidate.entries, skipTransitions)
    if (candidate.summaryText) {
      blocks.push({ id: 'summary', type: 'text', text: candidate.summaryText })
    }
  }

  blocks.push({ id: 'question', type: 'question', text: candidate.question })
  return blocks
}
