'use client'

import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import type { MirrorExplorationBlock } from '@/lib/mirrorExploration'
import { formatMirrorDateTime } from '@/lib/mirrorTransition'
import {
  MIRROR_EXPLORATION_REVEAL,
  entryChipUnitCount,
  scheduleExplorationWordTicks,
  splitRevealWords,
} from '@/lib/mirrorReveal'

export interface ExplorationEntryReveal {
  headerWords: number
  bodyWords: number
  chipCount: number
}

export interface ExplorationBlockReveal {
  introWords: number
  /** How many entries from the top are mounted (one-by-one, top to bottom). */
  visibleEntryCount: number
  entries: Record<string, ExplorationEntryReveal>
}

export const emptyExplorationBlockReveal = (): ExplorationBlockReveal => ({
  introWords: 0,
  visibleEntryCount: 0,
  entries: {},
})

export function useMirrorExplorationReveal(
  explorationBlocks: MirrorExplorationBlock[],
  relevantMeta: string[] | undefined,
  sched: (fn: () => void, ms: number) => void,
  clear: () => void,
  setReveal: Dispatch<SetStateAction<Record<string, ExplorationBlockReveal>>>,
  scrollAfterExpand: () => void,
) {
  const scheduledRef = useRef(new Set<string>())

  useEffect(() => {
    if (!explorationBlocks.length) {
      scheduledRef.current.clear()
      return
    }

    for (const block of explorationBlocks) {
      if (scheduledRef.current.has(block.id)) continue
      scheduledRef.current.add(block.id)

      setReveal(p => ({
        ...p,
        [block.id]: p[block.id] ?? emptyExplorationBlockReveal(),
      }))

      let d = MIRROR_EXPLORATION_REVEAL.startDelay
      sched(() => scrollAfterExpand(), d)

      const introLen = splitRevealWords(block.intro).length
      d = scheduleExplorationWordTicks(
        introLen,
        d,
        n => {
          setReveal(p => ({
            ...p,
            [block.id]: { ...p[block.id]!, introWords: n },
          }))
          if (n > 0 && n % 4 === 0) scrollAfterExpand()
        },
        sched,
      )
      d += MIRROR_EXPLORATION_REVEAL.blockGap

      block.entries.forEach((entry, ei) => {
        const headerLen = splitRevealWords(formatMirrorDateTime(entry.created_at)).length
        const bodyLen = splitRevealWords(entry.text).length
        const chipLen = entryChipUnitCount(entry, relevantMeta)

        sched(() => {
          setReveal(p => ({
            ...p,
            [block.id]: {
              ...p[block.id]!,
              visibleEntryCount: ei + 1,
              entries: {
                ...p[block.id]!.entries,
                [entry.id]: p[block.id]!.entries[entry.id] ?? {
                  headerWords: 0,
                  bodyWords: 0,
                  chipCount: 0,
                },
              },
            },
          }))
          scrollAfterExpand()
        }, d)

        d = scheduleExplorationWordTicks(
          headerLen,
          d,
          n => {
            setReveal(p => ({
              ...p,
              [block.id]: {
                ...p[block.id]!,
                entries: {
                  ...p[block.id]!.entries,
                  [entry.id]: {
                    ...(p[block.id]!.entries[entry.id] ?? {
                      headerWords: 0,
                      bodyWords: 0,
                      chipCount: 0,
                    }),
                    headerWords: n,
                  },
                },
              },
            }))
          },
          sched,
        )

        d = scheduleExplorationWordTicks(
          bodyLen,
          d,
          n => {
            setReveal(p => ({
              ...p,
              [block.id]: {
                ...p[block.id]!,
                entries: {
                  ...p[block.id]!.entries,
                  [entry.id]: {
                    ...p[block.id]!.entries[entry.id]!,
                    bodyWords: n,
                  },
                },
              },
            }))
            if (n > 0 && n % 5 === 0) scrollAfterExpand()
          },
          sched,
        )

        for (let ci = 0; ci < chipLen; ci++) {
          d += MIRROR_EXPLORATION_REVEAL.chip
          const count = ci + 1
          sched(() => {
            setReveal(p => ({
              ...p,
              [block.id]: {
                ...p[block.id]!,
                entries: {
                  ...p[block.id]!.entries,
                  [entry.id]: {
                    ...p[block.id]!.entries[entry.id]!,
                    chipCount: count,
                  },
                },
              },
            }))
            scrollAfterExpand()
          }, d)
        }

        d += MIRROR_EXPLORATION_REVEAL.blockGap
      })

      sched(() => scrollAfterExpand(), d)
    }
  }, [explorationBlocks, relevantMeta, sched, setReveal, scrollAfterExpand])
}
