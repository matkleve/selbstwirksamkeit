'use client'

import { cn } from '@/lib/cn'
import type { MirrorCandidate } from '@/lib/patternDetection'
import { EntryDisplay } from '@/components/entry'
import { MirrorRevealWords } from '@/components/mirror/MirrorRevealWords'
import { MirrorTimelineRow } from '@/components/mirror/MirrorFlow.timeline'
import type { BlockState, NarrativeBlock } from '@/components/mirror/MirrorFlow.types'
import { splitRevealWords } from '@/lib/mirrorReveal'

export function MirrorNarrativeBlock({
  block,
  idx,
  states,
  candidate,
  blockWords,
  wordProgress,
  isWordTyping,
}: {
  block: NarrativeBlock
  idx: number
  states: Record<string, BlockState>
  candidate: MirrorCandidate | null
  blockWords: (text: string) => string[]
  wordProgress: (id: string, text: string) => number
  isWordTyping: (id: string, text: string) => boolean
}) {
  return (
    <MirrorTimelineRow markerType={block.type} markerIdx={idx}>
      {block.type === 'text' && (
        <MirrorRevealWords
          as="p"
          words={blockWords(block.text)}
          visibleCount={wordProgress(block.id, block.text)}
          showCursor={isWordTyping(block.id, block.text)}
          className={cn(
            'font-display text-[1.0625rem] leading-snug text-[var(--foreground)]',
            block.muted ? 'text-ink-3' : 'text-ink-2',
          )}
        />
      )}

      {block.type === 'question' && (
        <MirrorRevealWords
          as="p"
          words={blockWords(block.text)}
          visibleCount={wordProgress(block.id, block.text)}
          showCursor={isWordTyping(block.id, block.text)}
          className="font-display text-base italic leading-snug text-ink-2"
        />
      )}

      {block.type === 'transition' && (
        <MirrorRevealWords
          as="p"
          words={blockWords(block.text)}
          visibleCount={wordProgress(block.id, block.text)}
          showCursor={isWordTyping(block.id, block.text)}
          className="font-display text-sm italic text-ink-3"
        />
      )}

      {block.type === 'entry' && (
        <EntryDisplay
          entry={block.entry}
          variant="chips-closed"
          header="mirror"
          size="sm"
          lines="none"
          menu={false}
          card
          relevantMeta={candidate?.relevantMeta}
          reveal={{
            headerWordCount: states[block.id]?.entryHeaderWords ?? 0,
            bodyWordCount: states[block.id]?.entryBodyWords ?? 0,
            chipCount: states[block.id]?.entryChips ?? 0,
          }}
        />
      )}
    </MirrorTimelineRow>
  )
}

export { splitRevealWords }
