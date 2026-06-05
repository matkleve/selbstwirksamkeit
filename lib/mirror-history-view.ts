import type { MirrorSessionRow } from '@/lib/mirror-session'

export type MirrorHistorySort = 'favorites_first' | 'newest_first' | 'oldest_first'
export type MirrorHistoryFilter =
  | 'all'
  | 'wgarm_ec'
  | 'tag_frequency'
  | 'time_correlation'
  | 'weekday_pattern'
  | 'temporal_echo'
  | 'grid_cluster'
  | 'valence_shift'

export const MIRROR_HISTORY_SORT_OPTIONS: { id: MirrorHistorySort; label: string }[] = [
  { id: 'favorites_first', label: 'Favoriten zuerst' },
  { id: 'newest_first',    label: 'Neueste zuerst' },
  { id: 'oldest_first',   label: 'Älteste zuerst' },
]

export const MIRROR_HISTORY_FILTER_OPTIONS: { id: MirrorHistoryFilter; label: string }[] = [
  { id: 'all',              label: 'Alle' },
  { id: 'wgarm_ec',         label: 'Assoziationsmuster' },
  { id: 'tag_frequency',    label: 'Wiederholendes Thema' },
  { id: 'time_correlation', label: 'Tageszeitenmuster' },
  { id: 'weekday_pattern',  label: 'Wochentags-Muster' },
  { id: 'temporal_echo',    label: 'Zeitliches Echo' },
  { id: 'grid_cluster',     label: 'Emotionaler Schwerpunkt' },
  { id: 'valence_shift',    label: 'Stimmungsveränderung' },
]

export function applySortFilter(
  sessions: MirrorSessionRow[],
  sort: MirrorHistorySort,
  filter: MirrorHistoryFilter,
): MirrorSessionRow[] {
  let list = filter === 'all'
    ? sessions
    : sessions.filter(s => s.pattern_type === filter)

  if (sort === 'favorites_first') {
    list = [...list].sort((a, b) => {
      if (a.is_favorited !== b.is_favorited) return a.is_favorited ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  } else if (sort === 'newest_first') {
    list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } else {
    list = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  return list
}
