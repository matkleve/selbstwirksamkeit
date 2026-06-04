import { getEntryMeta, isMetaRelevant } from '@/lib/entryMeta'
import { avgGridX, pickDisplayEntries, sortByDate } from '@/lib/mirrorPatternHelpers'
import type { MirrorCandidate } from '@/lib/patternDetection'
import type { Entry } from '@/lib/types'

export interface MirrorExplorationBlock {
  id: string
  kind: MirrorExplorationKind
  intro: string
  entries: Entry[]
}

export type MirrorExplorationKind = 'more' | 'positive' | 'contrast'

export const MIRROR_EXPLORATION_INTROS: Record<
  MirrorExplorationKind,
  readonly string[]
> = {
  more: [
    'Hier hast du mehr Beispiele.',
    'Noch ein paar Momente, die dazu passen.',
    'Das sind weitere Einträge aus dem gleichen Muster.',
    'Schau — noch mehr Stellen, die ähnlich sind.',
  ],
  positive: [
    'Hier sind positive Momente, die dazu gehören könnten.',
    'Ein paar Momente, die sich heller angefühlt haben.',
    'Das sind Stellen, an denen es eher leicht war.',
    'Hier hast du positive Momente aus dem gleichen Kontext.',
  ],
  contrast: [
    'Hier hast du Situationen, in denen es anders war.',
    'Momente, in denen es sich anders angefühlt hat.',
    'Das sind Einträge, die nicht ins gleiche Bild passen.',
    'Hier siehst du, wo es anders lief.',
  ],
}

export function pickMirrorExplorationIntro(kind: MirrorExplorationKind): string {
  const pool = MIRROR_EXPLORATION_INTROS[kind]
  return pool[Math.floor(Math.random() * pool.length)]!
}

export interface MirrorExplorationOffers {
  more: boolean
  positive: boolean
  contrast: boolean
}

function sharesPatternMeta(entry: Entry, meta: string[]): boolean {
  if (!meta.length) return false
  return getEntryMeta(entry).some(g => g.values.some(v => isMetaRelevant(v, meta)))
}

function isPositiveMoment(entry: Entry): boolean {
  return entry.grid_x !== null && entry.grid_x >= 0 && (entry.grid_y ?? 0) >= 0
}

function isContrastMoment(entry: Entry, patternValence: number): boolean {
  if (entry.grid_x === null) return false
  if (patternValence > 0.15) return entry.grid_x < 0
  if (patternValence < -0.15) return entry.grid_x > 0
  return false
}

export function getMirrorExplorationOffers(
  candidate: MirrorCandidate,
  allEntries: Entry[],
): MirrorExplorationOffers {
  const shown = new Set(candidate.entries.map(e => e.id))
  const inPattern = allEntries.filter(e => candidate.entryIds.includes(e.id))
  const more = inPattern.some(e => !shown.has(e.id))

  const patternValence = avgGridX(candidate.entries)
  const meta = candidate.relevantMeta ?? []

  const candidates = allEntries.filter(e => !shown.has(e.id))
  const related = (e: Entry) =>
    candidate.entryIds.includes(e.id) || sharesPatternMeta(e, meta)

  const positive =
    patternValence <= 0.2 &&
    candidates.some(e => related(e) && isPositiveMoment(e))

  const contrast = candidates.some(e => related(e) && isContrastMoment(e, patternValence))

  return { more, positive, contrast }
}

export function entriesForMirrorExploration(
  kind: MirrorExplorationKind,
  candidate: MirrorCandidate,
  allEntries: Entry[],
): Entry[] {
  const shown = new Set(candidate.entries.map(e => e.id))
  const meta = candidate.relevantMeta ?? []
  const patternValence = avgGridX(candidate.entries)

  let pool: Entry[] = []
  if (kind === 'more') {
    pool = allEntries.filter(e => candidate.entryIds.includes(e.id) && !shown.has(e.id))
  } else if (kind === 'positive') {
    pool = allEntries.filter(
      e =>
        !shown.has(e.id) &&
        (candidate.entryIds.includes(e.id) || sharesPatternMeta(e, meta)) &&
        isPositiveMoment(e),
    )
  } else {
    pool = allEntries.filter(
      e =>
        !shown.has(e.id) &&
        (candidate.entryIds.includes(e.id) || sharesPatternMeta(e, meta)) &&
        isContrastMoment(e, patternValence),
    )
  }

  return pickDisplayEntries(sortByDate(pool), 3)
}
