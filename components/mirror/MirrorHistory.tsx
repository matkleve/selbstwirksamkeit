'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Info, Star, MoreVertical, RefreshCw, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { DropdownPanel } from '@/components/DropdownPanel'
import { EntryDisplay } from '@/components/entry/EntryDisplay'
import type { MirrorSessionRow } from '@/lib/mirror-session'
import type { Entry } from '@/lib/types'
import {
  applySortFilter,
  type MirrorHistorySort,
  type MirrorHistoryFilter,
} from '@/lib/mirror-history-view'

interface Props {
  sessions: MirrorSessionRow[]
  entriesById: Record<string, Entry>
  sort: MirrorHistorySort
  filter: MirrorHistoryFilter
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
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const MENU_GAP = 6

interface SessionMenuProps {
  onRedo: () => Promise<void>
  onDelete: () => Promise<void>
}

function SessionMenu({ onRedo, onDelete }: SessionMenuProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + MENU_GAP, left: rect.right })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node)) return
      if (menuRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const items = [
    {
      type: 'item' as const, id: 'redo', label: 'Erneut machen', icon: RefreshCw,
      onClick: () => { setOpen(false); void onRedo() },
    },
    { type: 'separator' as const },
    {
      type: 'item' as const, id: 'delete', label: 'Löschen', icon: Trash2, destructive: true,
      onClick: () => { setOpen(false); void onDelete() },
    },
  ]

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { open ? setOpen(false) : (updatePosition(), setOpen(true)) }}
        className={cn(
          'flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors',
          'hover:bg-subtle hover:text-ink-2',
          open && 'bg-subtle text-ink-2',
        )}
        aria-label="Session-Menü"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical size={16} strokeWidth={1.75} />
      </button>
      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[200]"
          style={{ top: menuPos.top, left: menuPos.left, transform: 'translateX(-100%)' }}
        >
          <DropdownPanel align="right" minWidth={170} anchored={false} items={items} />
        </div>,
        document.body,
      )}
    </>
  )
}

export function MirrorHistory({ sessions, entriesById, sort, filter, onSessionsChange }: Props) {
  const supabase = createClient()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openInfoId, setOpenInfoId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleFavorite = async (session: MirrorSessionRow) => {
    setBusyId(session.id)
    const next = !session.is_favorited
    await supabase.from('mirror_sessions').update({ is_favorited: next }).eq('id', session.id)
    onSessionsChange?.(sessions.map(s => s.id === session.id ? { ...s, is_favorited: next } : s))
    setBusyId(null)
  }

  const handleRedo = async (session: MirrorSessionRow) => {
    setBusyId(session.id)
    if (session.pattern_type && session.anchor_entry_ids?.length) {
      await supabase
        .from('mirror_candidates')
        .update({ shown: false, shown_at: null, user_reaction: null })
        .eq('source', session.pattern_type)
        .contains('entry_ids', session.anchor_entry_ids)
    }
    await supabase.from('mirror_sessions').delete().eq('id', session.id)
    onSessionsChange?.(sessions.filter(s => s.id !== session.id))
    setBusyId(null)
  }

  const handleDelete = async (session: MirrorSessionRow) => {
    setBusyId(session.id)
    await supabase.from('mirror_sessions').delete().eq('id', session.id)
    onSessionsChange?.(sessions.filter(s => s.id !== session.id))
    setBusyId(null)
  }

  const visible = applySortFilter(sessions, sort, filter)

  if (!sessions.length) {
    return (
      <div>
        <p className="section-label">Verlauf</p>
        <p className="text-sm text-ink-3">
          Noch keine Spiegel-Sitzungen — öffne deinen ersten Spiegel oben.
        </p>
      </div>
    )
  }

  if (!visible.length) {
    return (
      <div>
        <p className="section-label">Verlauf</p>
        <p className="text-sm text-ink-3">Keine Sitzungen für diesen Filter.</p>
      </div>
    )
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {visible.map(session => {
        const anchors = (session.anchor_entry_ids ?? [])
          .map(id => entriesById[id])
          .filter(Boolean) as Entry[]
        const typeInfo = session.pattern_type ? PATTERN_TYPE_INFO[session.pattern_type] : null
        const infoOpen = openInfoId === session.id
        const busy = busyId === session.id
        const expanded = expandedIds.has(session.id)

        return (
          <li
            key={session.id}
            className={cn(
              'rounded-card border border-edge bg-card shadow-card',
              busy && 'pointer-events-none opacity-60',
            )}
          >
            {/* Clickable header — always visible */}
            <button
              type="button"
              onClick={() => toggleExpanded(session.id)}
              className="flex w-full items-start gap-2 p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                {/* Date row with ⓘ — inline-flex so icon sits on same baseline */}
                <div className="mb-1 inline-flex items-center gap-1.5">
                  <time className="text-[0.6875rem] font-medium uppercase leading-none tracking-wide text-ink-3">
                    {formatSessionDate(session.created_at)}
                  </time>
                  {typeInfo && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Muster-Info anzeigen"
                      onClick={e => { e.stopPropagation(); setOpenInfoId(infoOpen ? null : session.id) }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setOpenInfoId(infoOpen ? null : session.id) }}}
                      className={cn(
                        'inline-flex items-center justify-center rounded p-0.5 transition-colors',
                        infoOpen ? 'text-ink-2' : 'text-ink-3 hover:text-ink-2',
                      )}
                    >
                      <Info size={12} strokeWidth={1.75} />
                    </span>
                  )}
                </div>
                {session.pattern_text && (
                  <p className="text-sm leading-snug text-ink">{session.pattern_text}</p>
                )}
              </div>
              {/* Right side: star + menu + chevron */}
              <div className="flex shrink-0 items-center gap-0.5" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  aria-label={session.is_favorited ? 'Favorit entfernen' : 'Als Favorit markieren'}
                  disabled={busy}
                  onClick={() => void toggleFavorite(session)}
                  className={cn(
                    'rounded-lg p-1.5 transition-colors',
                    session.is_favorited ? 'text-mirror-gold' : 'text-ink-3 hover:text-ink-2',
                  )}
                >
                  <Star size={18} strokeWidth={1.5} fill={session.is_favorited ? 'currentColor' : 'none'} />
                </button>
                <SessionMenu
                  onRedo={() => handleRedo(session)}
                  onDelete={() => handleDelete(session)}
                />
              </div>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className={cn('shrink-0 self-center text-ink-3 transition-transform', expanded && 'rotate-180')}
                aria-hidden
              />
            </button>

            {/* Expanded content */}
            {expanded && (
              <div className="px-4 pb-4">
                {/* Info panel */}
                {infoOpen && typeInfo && (
                  <div className="mb-3 rounded-lg bg-subtle px-3 py-2.5">
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

                {/* Anchor entries — EntryDisplay without color rail */}
                {anchors.length > 0 && (
                  <div className="mb-3 flex flex-col gap-2">
                    {anchors.map(entry => (
                      <EntryDisplay
                        key={entry.id}
                        entry={entry}
                        variant="text"
                        size="sm"
                        card={true}
                        menu={true}
                        lines="none"
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
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
