'use client'

import { useState } from 'react'
import { Info, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import type { MirrorSessionRow } from '@/lib/mirror-session'
import type { Entry } from '@/lib/types'
import { EntryDisplay } from '@/components/entry/EntryDisplay'

interface Props {
  sessions: MirrorSessionRow[]
  entriesById: Record<string, Entry>
  onSessionsChange?: (sessions: MirrorSessionRow[]) => void
}

const PATTERN_TYPE_INFO: Record<string, { label: string; description: string }> = {
  wgarm_ec: {
    label: 'Assoziationsmuster',
    description:
      'Mehrere Merkmale deiner Einträge — Tageszeit, Wochentag, Personen oder Orte — kommen wiederholt zusammen mit einem bestimmten Zustand vor.',
  },
  valence_shift: {
    label: 'Stimmungsveränderung',
    description: 'Zu ähnlichen Themen schreibst du heute anders als noch vor einigen Monaten.',
  },
  temporal_echo: {
    label: 'Zeitliches Echo',
    description: 'Einträge aus verschiedenen Zeiträumen klingen inhaltlich sehr ähnlich.',
  },
  tag_frequency: {
    label: 'Wiederkehrendes Thema',
    description:
      'Eine Person, ein Ort oder eine Aktivität taucht regelmäßig und über einen längeren Zeitraum auf.',
  },
  grid_cluster: {
    label: 'Emotionaler Schwerpunkt',
    description:
      'Mehrere Einträge zeigen ähnliche emotionale Zustände — ein wiederkehrendes Muster in deiner inneren Wahrnehmung.',
  },
  time_correlation: {
    label: 'Tageszeitenmuster',
    description: 'Zu bestimmten Tageszeiten schreibst du systematisch positiver oder negativer.',
  },
  weekday_pattern: {
    label: 'Wochentags-Muster',
    description: 'Deine Einträge an Werktagen und am Wochenende unterscheiden sich deutlich.',
  },
}

const SIGNAL_LABELS: Record<string, string> = {
  strong: 'Stark',
  moderate: 'Mittel',
  weak: 'Schwach',
}

function formatSessionDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MirrorHistory({ sessions, entriesById, onSessionsChange }: Props) {
  const supabase = createClient()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openInfoId, setOpenInfoId] = useState<string | null>(null)

  const toggleFavorite = async (session: MirrorSessionRow) => {
    setBusyId(session.id)
    const next = !session.is_favorited
    await supabase.from('mirror_sessions').update({ is_favorited: next }).eq('id', session.id)
    onSessionsChange?.(
      sessions.map(s => (s.id === session.id ? { ...s, is_favorited: next } : s)),
    )
    setBusyId(null)
  }

  if (!sessions.length) {
    return (
      <p className="text-sm text-ink-3">
        Noch keine Spiegel-Sitzungen — öffne deinen ersten Spiegel oben.
      </p>
    )
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {sessions.map(session => {
        const anchors = (session.anchor_entry_ids ?? [])
          .map(id => entriesById[id])
          .filter(Boolean) as Entry[]

        const typeInfo = session.pattern_type ? PATTERN_TYPE_INFO[session.pattern_type] : null
        const infoOpen = openInfoId === session.id

        return (
          <li
            key={session.id}
            className="rounded-card border border-edge bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <time className="text-[0.6875rem] font-medium uppercase tracking-wide text-ink-3">
                    {formatSessionDate(session.created_at)}
                  </time>
                  {typeInfo && (
                    <button
                      type="button"
                      aria-label="Muster-Info anzeigen"
                      onClick={() => setOpenInfoId(infoOpen ? null : session.id)}
                      className={cn(
                        'flex items-center justify-center rounded p-0.5 transition-colors',
                        infoOpen ? 'text-ink-2' : 'text-ink-3 hover:text-ink-2',
                      )}
                    >
                      <Info size={12} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
                {session.pattern_text && (
                  <p className="mt-1 text-sm leading-snug text-ink">{session.pattern_text}</p>
                )}
              </div>
              <button
                type="button"
                aria-label={session.is_favorited ? 'Favorit entfernen' : 'Als Favorit markieren'}
                disabled={busyId === session.id}
                onClick={() => void toggleFavorite(session)}
                className={cn(
                  'shrink-0 rounded-lg p-1.5 transition-colors',
                  session.is_favorited ? 'text-[var(--mirror-gold)]' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                <Star size={18} strokeWidth={1.5} fill={session.is_favorited ? 'currentColor' : 'none'} />
              </button>
            </div>

            {infoOpen && typeInfo && (
              <div className="mb-3 rounded-lg bg-[var(--muted)] px-3 py-2.5">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-ink-2">{typeInfo.label}</span>
                  {session.signal_strength && (
                    <span className="text-[0.6875rem] text-ink-3">
                      {SIGNAL_LABELS[session.signal_strength] ?? session.signal_strength}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-ink-3">{typeInfo.description}</p>
              </div>
            )}

            {anchors.length > 0 && (
              <div className="mb-3 flex flex-col gap-2">
                {anchors.map(entry => (
                  <EntryDisplay
                    key={entry.id}
                    entry={entry}
                    variant="compact"
                    size="sm"
                    menu={false}
                    card={false}
                    lines={2}
                  />
                ))}
              </div>
            )}

            {session.user_response && (
              <p className="mb-2 text-sm italic text-ink-3">{session.user_response}</p>
            )}

            {session.intention_wenn && session.intention_dann && (
              <p className="text-sm text-ink-2">
                Wenn {session.intention_wenn}, dann {session.intention_dann}.
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
