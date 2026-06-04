'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, User, Zap, X } from 'lucide-react'
import EntryGrid from '@/components/EntryGrid'
import { AddChip, EntityChipEditor, FilledChip } from '@/components/EntityChip'
import FeelingChip from '@/components/FeelingChip'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useEntries } from '@/components/EntriesProvider'
import { ENTRY_SELECT } from '@/lib/entry-fields'
import { cardBoxShadow } from '@/lib/gridZones'
import { createClient } from '@/lib/supabase'
import { FEELINGS } from '@/lib/feelings'
import { formatTime } from '@/lib/utils'
import type { BodyState, Entry, GridPoint } from '@/lib/types'

interface Props {
  entry: Entry
  onClose: () => void
}

function feelingLabelFor(entry: Entry): string | null {
  if (!entry.body_state) return null
  return FEELINGS.find(f => f.bodyState === entry.body_state)?.label ?? null
}

export function EntryEditOverlay({ entry, onClose }: Props) {
  const { refresh, entryNumber } = useEntries()
  const supabase = createClient()
  const num = entryNumber(entry.id)

  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(entry.title ?? '')
  const [text, setText] = useState(entry.text)
  const [grid, setGrid] = useState<GridPoint>({
    x: entry.grid_x ?? 0,
    y: entry.grid_y ?? 0,
  })
  const [person, setPerson] = useState(entry.person ?? '')
  const [location, setLocation] = useState(entry.location ?? '')
  const [activity, setActivity] = useState(entry.activity ?? '')
  const [bodyState, setBodyState] = useState<BodyState | null>(entry.body_state)
  const [feelingLabel, setFeelingLabel] = useState<string | null>(feelingLabelFor(entry))
  const [reframe, setReframe] = useState(entry.reframe ?? '')
  const [openChip, setOpenChip] = useState<'person' | 'location' | 'activity' | null>(null)
  const [suggestions, setSuggestions] = useState({
    person: [] as string[],
    location: [] as string[],
    activity: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clock] = useState(() => formatTime(new Date(entry.created_at)))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  useEffect(() => {
    Promise.all([
      supabase.from('persons').select('name').order('name'),
      supabase.from('locations').select('name').order('name'),
      supabase.from('activities').select('name').order('name'),
    ]).then(([p, l, a]) =>
      setSuggestions({
        person: p.data?.map(r => r.name) ?? [],
        location: l.data?.map(r => r.name) ?? [],
        activity: a.data?.map(r => r.name) ?? [],
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, [])

  const cardShadow = cardBoxShadow(grid.x, grid.y)

  const saveEntityNames = async (uid: string) => {
    if (person.trim()) {
      await supabase.from('persons').upsert(
        { user_id: uid, name: person.trim() },
        { onConflict: 'user_id,name', ignoreDuplicates: true },
      )
    }
    if (location.trim()) {
      await supabase.from('locations').upsert(
        { user_id: uid, name: location.trim() },
        { onConflict: 'user_id,name', ignoreDuplicates: true },
      )
    }
    if (activity.trim()) {
      await supabase.from('activities').upsert(
        { user_id: uid, name: activity.trim() },
        { onConflict: 'user_id,name', ignoreDuplicates: true },
      )
    }
  }

  const handleSave = async () => {
    if (!text.trim()) {
      setError('Text darf nicht leer sein.')
      return
    }
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('entries')
      .update({
        title: title.trim() || null,
        text: text.trim(),
        grid_x: grid.x,
        grid_y: grid.y,
        person: person.trim() || null,
        location: location.trim() || null,
        activity: activity.trim() || null,
        body_state: bodyState,
        reframe: reframe.trim() || null,
      })
      .eq('id', entry.id)
      .select(ENTRY_SELECT)
      .single()

    if (updateError) {
      setSaving(false)
      setError(updateError.message)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) await saveEntityNames(user.id)

    setSaving(false)
    await refresh()
    onClose()
  }

  const chips = [
    { key: 'person' as const, Icon: User, placeholder: 'z.B. Mama', label: 'Person', value: person, setValue: setPerson },
    { key: 'location' as const, Icon: MapPin, placeholder: 'z.B. Büro', label: 'Ort', value: location, setValue: setLocation },
    { key: 'activity' as const, Icon: Zap, placeholder: 'z.B. Pendeln', label: 'Tätigkeit', value: activity, setValue: setActivity },
  ]

  const titlePlaceholder = num != null ? `Eintrag #${num}` : 'Eintrag'

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Eintrag bearbeiten"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[540px] md:max-w-[880px] max-h-[min(92vh,900px)] overflow-y-auto">
        <div className="entry-card" style={{ boxShadow: cardShadow }}>
          <div className="entry-card-header">
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 60))}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false)
                }}
                placeholder={titlePlaceholder}
                className="min-w-0 flex-1 border-0 border-b border-ring bg-transparent py-px text-base font-medium text-ink outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-left text-sm font-medium text-ink hover:text-ink-2"
                style={{ color: title ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {title || titlePlaceholder}
              </button>
            )}
            <span className="inline-flex shrink-0 items-center gap-2 text-xs text-ink-3">
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} strokeWidth={1.75} aria-hidden />
                  {location}
                </span>
              )}
              <span>{clock}</span>
              <button
                type="button"
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-subtle hover:text-ink"
                aria-label="Schließen"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </span>
          </div>

          <div className="entry-card-columns">
            <section className="entry-card-valence" aria-label="Stimmungsfeld">
              <div className="entry-grid-wrap">
                <EntryGrid value={grid} onChange={setGrid} />
              </div>
            </section>

            <section className="entry-card-compose" aria-label="Eintrag">
              <div className="entry-textarea">
                <Textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Was geht dir durch den Kopf?"
                  rows={3}
                  style={{ minHeight: 84 }}
                />
              </div>

              <div className="entry-card-chips">
                {chips.map(chip => {
                  if (openChip === chip.key) {
                    const commitChip = () => {
                      if (!chip.value.trim()) chip.setValue('')
                      setOpenChip(null)
                    }
                    return (
                      <div
                        key={chip.key}
                        className="inline-flex"
                        onBlur={e => {
                          if (e.currentTarget.contains(e.relatedTarget as Node)) return
                          commitChip()
                        }}
                      >
                        <EntityChipEditor
                          icon={chip.Icon}
                          value={chip.value}
                          onChange={chip.setValue}
                          onClose={commitChip}
                          placeholder={chip.placeholder}
                          suggestions={suggestions[chip.key]}
                        />
                      </div>
                    )
                  }
                  if (chip.value) {
                    return (
                      <FilledChip
                        key={chip.key}
                        icon={chip.Icon}
                        value={chip.value}
                        onClear={() => {
                          chip.setValue('')
                          setOpenChip(null)
                        }}
                      />
                    )
                  }
                  return (
                    <AddChip
                      key={chip.key}
                      icon={chip.Icon}
                      label={chip.label}
                      onClick={() => setOpenChip(chip.key)}
                    />
                  )
                })}
                <FeelingChip
                  feelingLabel={feelingLabel}
                  bodyState={bodyState}
                  onSelect={(label, state) => {
                    setFeelingLabel(label)
                    setBodyState(state)
                  }}
                  onClear={() => {
                    setFeelingLabel(null)
                    setBodyState(null)
                  }}
                />
              </div>

              <div className="entry-textarea">
                <Textarea
                  value={reframe}
                  onChange={e => setReframe(e.target.value)}
                  rows={2}
                  placeholder="Reframe — wie siehst du das heute?"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="mb-3 rounded-lg border border-[var(--danger)] px-3 py-2.5 text-sm text-danger"
                  style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)' }}
                >
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" size="lg" className="flex-1" onClick={onClose} disabled={saving}>
                  Abbrechen
                </Button>
                <Button size="lg" className="flex-1" onClick={handleSave} disabled={saving || !text.trim()}>
                  {saving ? 'Speichern…' : 'Speichern'}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
