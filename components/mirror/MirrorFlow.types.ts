import type { MirrorCandidate } from '@/lib/patternDetection'

export type NarrativeBlock =
  | { id: string; type: 'text'; text: string; muted?: boolean }
  | { id: string; type: 'entry'; entry: MirrorCandidate['entries'][number] }
  | { id: string; type: 'transition'; text: string }
  | { id: string; type: 'question'; text: string }

export interface BlockState {
  visible: boolean
  wordCount: number
  entryHeaderWords: number
  entryBodyWords: number
  entryChips: number
}

export const emptyBlockState = (): BlockState => ({
  visible: false,
  wordCount: 0,
  entryHeaderWords: 0,
  entryBodyWords: 0,
  entryChips: 0,
})
