'use client'

import { useEffect, useRef } from 'react'
import type { BlockState, NarrativeBlock } from '@/components/mirror/MirrorFlow.types'

export function useMirrorBlockAutoScroll(
  phase: 'loading' | 'mirror',
  blocks: NarrativeBlock[],
  states: Record<string, BlockState>,
  narrativeDone: boolean,
  pastReflection: boolean,
  showSummary: boolean,
  scrollAfterExpand: () => void,
) {
  const seenBlocksRef = useRef(new Set<string>())
  const seenSectionsRef = useRef({
    narrativeDone: false,
    pastReflection: false,
    showSummary: false,
  })

  useEffect(() => {
    if (phase !== 'mirror') return
    for (const block of blocks) {
      if (states[block.id]?.visible && !seenBlocksRef.current.has(block.id)) {
        seenBlocksRef.current.add(block.id)
        scrollAfterExpand()
      }
    }
  }, [phase, blocks, states, scrollAfterExpand])

  useEffect(() => {
    if (phase !== 'mirror') return
    const seen = seenSectionsRef.current
    if (narrativeDone && !seen.narrativeDone) {
      seen.narrativeDone = true
      scrollAfterExpand()
    }
    if (pastReflection && !seen.pastReflection) {
      seen.pastReflection = true
      scrollAfterExpand()
    }
    if (showSummary && !seen.showSummary) {
      seen.showSummary = true
      scrollAfterExpand()
    }
  }, [phase, narrativeDone, pastReflection, showSummary, scrollAfterExpand])
}
