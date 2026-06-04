import { getEntryMeta, isMetaRelevant } from '@/lib/entryMeta'
import { formatMirrorDateTime } from '@/lib/mirrorTransition'
import type { Entry } from '@/lib/types'

export const MIRROR_REVEAL = {
  loadingStep: 1100,
  /** Pause after a block finishes before the next one starts typing */
  blockGap: 120,
  wordBase: 158,
  wordSlowEvery: 6,
  wordSlowExtra: 240,
  wordPauseEvery: 11,
  wordPauseExtra: 420,
  chip: 268,
} as const

export function splitRevealWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

/** Deterministic word tick delay — occasional slower beats. */
export function wordTickDelay(wordIndex: number): number {
  let ms = MIRROR_REVEAL.wordBase
  if (wordIndex > 0 && wordIndex % MIRROR_REVEAL.wordSlowEvery === 0) {
    ms += MIRROR_REVEAL.wordSlowExtra
  }
  if (wordIndex > 0 && wordIndex % MIRROR_REVEAL.wordPauseEvery === 0) {
    ms += MIRROR_REVEAL.wordPauseExtra
  }
  return ms
}

export function entryChipUnitCount(entry: Entry, relevantMeta?: string[]): number {
  const groups = getEntryMeta(entry)
  if (!groups.length) return 0

  if (relevantMeta?.length) {
    let n = 0
    for (const g of groups) {
      const open = g.values.filter(v => isMetaRelevant(v, relevantMeta))
      const closed = g.values.length - open.length
      n += open.length
      if (closed > 0) n += 1
    }
    return n
  }
  return groups.length
}

export function entryRevealLengths(entry: Entry) {
  return {
    header: splitRevealWords(formatMirrorDateTime(entry.created_at)).length,
    body: splitRevealWords(entry.text).length,
    chips: entryChipUnitCount(entry),
  }
}

export function scheduleWordTicks(
  count: number,
  startAt: number,
  onTick: (wordIndex: number) => void,
  sched: (fn: () => void, ms: number) => void,
): number {
  if (count <= 0) return startAt
  let t = startAt + Math.round(MIRROR_REVEAL.wordBase * 0.55)
  for (let i = 0; i < count; i++) {
    const wi = i
    sched(() => onTick(wi + 1), t)
    if (i < count - 1) t += wordTickDelay(i + 1)
  }
  return t
}
