'use client'

import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { MirrorCandidate } from '@/lib/patternDetection'
import { formatMirrorDateTime } from '@/lib/mirrorTransition'
import type { BlockState, NarrativeBlock } from '@/components/mirror/MirrorFlow.types'
import {
  MIRROR_REVEAL,
  splitRevealWords,
  scheduleWordTicks,
  entryChipUnitCount,
} from '@/lib/mirrorReveal'

export function useMirrorNarrativeSchedule(
  phase: 'loading' | 'mirror',
  blocks: NarrativeBlock[],
  candidate: MirrorCandidate | null,
  sched: (fn: () => void, ms: number) => void,
  clear: () => void,
  setStates: Dispatch<SetStateAction<Record<string, BlockState>>>,
  setNarrativeDone: (v: boolean) => void,
) {
  useEffect(() => {
    if (phase !== 'mirror') return
    clear()
    let d = 400

    blocks.forEach(block => {
      if (block.type === 'entry') {
        const headerLen = splitRevealWords(formatMirrorDateTime(block.entry.created_at)).length
        const bodyLen = splitRevealWords(block.entry.text).length
        const chipLen = entryChipUnitCount(block.entry, candidate?.relevantMeta)

        d = scheduleWordTicks(
          headerLen,
          d,
          n => {
            setStates(p => ({
              ...p,
              [block.id]: { ...p[block.id], visible: true, entryHeaderWords: n },
            }))
          },
          sched,
        )

        d = scheduleWordTicks(
          bodyLen,
          d,
          n => {
            setStates(p => ({ ...p, [block.id]: { ...p[block.id], entryBodyWords: n } }))
          },
          sched,
        )

        for (let ci = 0; ci < chipLen; ci++) {
          d += MIRROR_REVEAL.chip
          const count = ci + 1
          sched(() => {
            setStates(p => ({ ...p, [block.id]: { ...p[block.id], entryChips: count } }))
          }, d)
        }
      } else if (
        block.type === 'text' ||
        block.type === 'question' ||
        block.type === 'transition'
      ) {
        const words = splitRevealWords(block.text)
        d = scheduleWordTicks(
          words.length,
          d,
          n => {
            setStates(p => ({
              ...p,
              [block.id]: { ...p[block.id], visible: true, wordCount: n },
            }))
          },
          sched,
        )
      }

      d += MIRROR_REVEAL.blockGap
    })

    sched(() => setNarrativeDone(true), d)

    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, blocks, candidate?.relevantMeta])
}
