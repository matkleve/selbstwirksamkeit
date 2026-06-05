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

/** Split comma- or semicolon-separated names. */
export function splitMetaValues(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)
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
