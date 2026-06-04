import type { MirrorCandidate } from '@/lib/patternDetection'
import { mirrorTransitionText } from '@/lib/mirrorTransition'
import type { NarrativeBlock } from '@/components/mirror/MirrorFlow.types'

export function buildNarrativeBlocks(candidate: MirrorCandidate | null): NarrativeBlock[] {
  if (!candidate) {
    return [
      {
        id: 'empty',
        type: 'text',
        text: 'Noch zu wenige Muster. Schreib weiter — ich schaue dann nochmal.',
        muted: true,
      },
    ]
  }

  const blocks: NarrativeBlock[] = [{ id: 'intro', type: 'text', text: candidate.introText }]

  candidate.entries.forEach((entry, i) => {
    blocks.push({ id: `entry-${i}`, type: 'entry', entry })
    const next = candidate.entries[i + 1]
    if (next) {
      blocks.push({
        id: `transition-${i}`,
        type: 'transition',
        text: mirrorTransitionText(entry.created_at, next.created_at),
      })
    }
  })

  blocks.push({ id: 'question', type: 'question', text: candidate.question })
  return blocks
}
