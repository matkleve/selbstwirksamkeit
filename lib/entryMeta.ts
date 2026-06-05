import type { BodyState, Entry } from '@/lib/types'

export type EntryMetaKind = 'person' | 'location' | 'activity' | 'body'

export interface EntryMetaGroup {
  kind: EntryMetaKind
  values: string[]
}

const BODY_LABELS: Record<BodyState, string> = {
  stressed: 'gestresst',
  calm: 'ruhig',
  tired: 'müde',
}

export type MetaTextField = 'person' | 'location' | 'activity'

/** Split comma- or semicolon-separated meta values (display case preserved). */
export function splitMetaValues(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)
}

/** Persist chip arrays as one DB column (comma-separated). */
export function joinMetaValues(values: string[]): string | null {
  const cleaned = values.map(s => s.trim()).filter(Boolean)
  return cleaned.length > 0 ? cleaned.join(', ') : null
}

/** Atomic tag values for one meta field (body_state → single German label). */
export function atomicMetaValues(
  field: MetaTextField | 'body_state',
  raw: string | null | undefined,
): string[] {
  if (!raw?.trim()) return []
  if (field === 'body_state') return [BODY_LABELS[raw as BodyState] ?? raw]
  return splitMetaValues(raw)
}

/** Case-insensitive identity for detector buckets and WGARM tag keys. */
export function metaTagKey(value: string): string {
  return value.toLowerCase().trim()
}

export function getEntryMeta(entry: Entry): EntryMetaGroup[] {
  const groups: EntryMetaGroup[] = []

  if (entry.person?.trim()) {
    groups.push({ kind: 'person', values: splitMetaValues(entry.person) })
  }
  if (entry.location?.trim()) {
    groups.push({ kind: 'location', values: splitMetaValues(entry.location) })
  }
  if (entry.activity?.trim()) {
    groups.push({ kind: 'activity', values: splitMetaValues(entry.activity) })
  }
  if (entry.body_state) {
    groups.push({ kind: 'body', values: [BODY_LABELS[entry.body_state]] })
  }

  return groups
}

export function metaCount(groups: EntryMetaGroup[]): number {
  return groups.reduce((n, g) => n + g.values.length, 0)
}

export function normalizeMetaMatch(value: string): string {
  return value.toLowerCase().trim()
}

export function isMetaRelevant(value: string, relevantMeta?: string[]): boolean {
  if (!relevantMeta?.length) return false
  const needle = normalizeMetaMatch(value)
  return relevantMeta.some(r => normalizeMetaMatch(r) === needle)
}
