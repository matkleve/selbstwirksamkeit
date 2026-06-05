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

/** Freitext-Exploration („Mehr Beispiele“) — etwas schneller als der Haupt-Flow */
export const MIRROR_EXPLORATION_REVEAL = {
  blockGap: 72,
  wordBase: 108,
  wordSlowEvery: 7,
  wordSlowExtra: 140,
  wordPauseEvery: 12,
  wordPauseExtra: 240,
  chip: 172,
  startDelay: 160,
} as const

export function splitRevealWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

/** Deterministic word tick delay — occasional slower beats. */
export function wordTickDelay(wordIndex: number): number {
  return wordTickDelayAt(wordIndex, MIRROR_REVEAL)
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

function wordTickDelayAt(
  wordIndex: number,
  cfg: {
    wordBase: number
    wordSlowEvery: number
    wordSlowExtra: number
    wordPauseEvery: number
    wordPauseExtra: number
  },
): number {
  let ms = cfg.wordBase
  if (wordIndex > 0 && wordIndex % cfg.wordSlowEvery === 0) ms += cfg.wordSlowExtra
  if (wordIndex > 0 && wordIndex % cfg.wordPauseEvery === 0) ms += cfg.wordPauseExtra
  return ms
}

type WordRevealTiming = {
  wordBase: number
  wordSlowEvery: number
  wordSlowExtra: number
  wordPauseEvery: number
  wordPauseExtra: number
}

export function scheduleWordTicks(
  count: number,
  startAt: number,
  onTick: (wordIndex: number) => void,
  sched: (fn: () => void, ms: number) => void,
  cfg: WordRevealTiming = MIRROR_REVEAL,
): number {
  if (count <= 0) return startAt
  let t = startAt + Math.round(cfg.wordBase * 0.55)
  for (let i = 0; i < count; i++) {
    const wi = i
    sched(() => onTick(wi + 1), t)
    if (i < count - 1) t += wordTickDelayAt(i + 1, cfg)
  }
  return t
}

export function scheduleExplorationWordTicks(
  count: number,
  startAt: number,
  onTick: (wordIndex: number) => void,
  sched: (fn: () => void, ms: number) => void,
): number {
  return scheduleWordTicks(count, startAt, onTick, sched, MIRROR_EXPLORATION_REVEAL)
}
