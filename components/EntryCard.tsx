'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import EntryGrid from './EntryGrid'
import ReframeFlow from './ReframeFlow'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cardBoxShadow, getZone, zoneTexts } from '@/lib/gridZones'
import type { GridPoint, Entry, BodyState } from '@/lib/types'
import { formatEntryDateTime } from '@/lib/utils'
import { User, MapPin, Zap } from 'lucide-react'
import { AddChip, FilledChip, EntityChipEditor } from '@/components/EntityChip'
import FeelingChip from '@/components/FeelingChip'
import { useEntries } from '@/components/EntriesProvider'

const CHIP_SELECT = 'id,user_id,title,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at'

export default function EntryCard() {
  const { refresh: refreshEntries } = useEntries()
  const [grid, setGrid] = useState<GridPoint>({ x: 0, y: 0 })
  const [title, setTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [entryCount, setEntryCount] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [person, setPerson] = useState('')
  const [location, setLocation] = useState('')
  const [activity, setActivity] = useState('')
  const [bodyState, setBodyState] = useState<BodyState | null>(null)
  const [feelingLabel, setFeelingLabel] = useState<string | null>(null)
  const [openChip, setOpenChip] = useState<'person' | 'location' | 'activity' | null>(null)
  const [quote, setQuote] = useState('')
  const [quoteVisible, setQuoteVisible] = useState(true)
  const [lastZone, setLastZone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [savedEntry, setSavedEntry] = useState<Entry | null>(null)
  const [clock, setClock] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState({ person: [] as string[], location: [] as string[], activity: [] as string[] })

  const supabase = createClient()

  useEffect(() => {
    const initial = zoneTexts[getZone(0, 0)]
    setQuote(initial[Math.floor(Math.random() * initial.length)])
    const tick = () => setClock(formatEntryDateTime(new Date()))
    tick()
    const id = setInterval(tick, 60_000)

    const loadExtras = () => {
      supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
      supabase.from('entries').select('id', { count: 'exact', head: true }).then(({ count }) => setEntryCount(count ?? 0))
      Promise.all([
        supabase.from('persons').select('name').order('name'),
        supabase.from('locations').select('name').order('name'),
        supabase.from('activities').select('name').order('name'),
      ]).then(([p, l, a]) => setSuggestions({
        person: p.data?.map(r => r.name) ?? [],
        location: l.data?.map(r => r.name) ?? [],
        activity: a.data?.map(r => r.name) ?? [],
      }))
    }
    const extrasTimer = window.setTimeout(loadExtras, 0)

    return () => {
      clearInterval(id)
      clearTimeout(extrasTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; supabase client is a singleton
  }, [])

  useEffect(() => {
    const zone = getZone(grid.x, grid.y)
    if (zone === lastZone) return
    setQuoteVisible(false)
    const t = setTimeout(() => {
      const texts = zoneTexts[zone]
      setQuote(texts[Math.floor(Math.random() * texts.length)])
      setLastZone(zone)
      setQuoteVisible(true)
    }, 280)
    return () => clearTimeout(t)
  }, [grid, lastZone])

  const cardShadow = cardBoxShadow(grid.x, grid.y)

  const saveEntityNames = (uid: string) => {
    if (person.trim()) supabase.from('persons').upsert({ user_id: uid, name: person.trim() }, { onConflict: 'user_id,name', ignoreDuplicates: true }).then()
    if (location.trim()) supabase.from('locations').upsert({ user_id: uid, name: location.trim() }, { onConflict: 'user_id,name', ignoreDuplicates: true }).then()
    if (activity.trim()) supabase.from('activities').upsert({ user_id: uid, name: activity.trim() }, { onConflict: 'user_id,name', ignoreDuplicates: true }).then()
  }

  const resetFormFields = () => {
    setTitle('')
    setEditingTitle(false)
    setText('')
    setPerson('')
    setLocation('')
    setActivity('')
    setBodyState(null)
    setFeelingLabel(null)
    setOpenChip(null)
    setGrid({ x: 0, y: 0 })
  }

  const finishAfterSave = () => {
    resetFormFields()
    setSavedEntry(null)
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    let uid = userId
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser()
      uid = user?.id ?? null
      if (uid) setUserId(uid)
    }
    if (!uid) {
      setSaving(false)
      setSaveError('Nicht angemeldet. Bitte Seite neu laden.')
      return
    }

    const { data, error } = await supabase.from('entries').insert({
      user_id: uid,
      title: title.trim() || null,
      text: text.trim(),
      grid_x: grid.x,
      grid_y: grid.y,
      person: person.trim() || null,
      location: location.trim() || null,
      activity: activity.trim() || null,
      body_state: bodyState,
    }).select(CHIP_SELECT).single()

    setSaving(false)

    if (error || !data) {
      setSaveError(error?.message ?? 'Speichern fehlgeschlagen.')
      return
    }

    saveEntityNames(uid)
    setEntryCount(c => (c !== null ? c + 1 : 1))
    void refreshEntries()

    const entry = data as Entry
    const needsReframe = entry.grid_x !== null && entry.grid_x < 0

    resetFormFields()

    if (needsReframe) {
      setSavedEntry(entry)
    } else {
      setSavedEntry(null)
      setSaveSuccess(true)
    }
  }

  useEffect(() => {
    if (!saveSuccess) return
    const t = setTimeout(() => setSaveSuccess(false), 3500)
    return () => clearTimeout(t)
  }, [saveSuccess])

  const chips = [
    { key: 'person'   as const, Icon: User,   placeholder: 'z.B. Mama',    label: 'Person',    value: person,   setValue: setPerson },
    { key: 'location' as const, Icon: MapPin, placeholder: 'z.B. Büro',    label: 'Ort',       value: location, setValue: setLocation },
    { key: 'activity' as const, Icon: Zap,    placeholder: 'z.B. Pendeln', label: 'Tätigkeit', value: activity, setValue: setActivity },
  ]

  return (
    <div className="entry-card" style={{ boxShadow: cardShadow }}>
      <div className="entry-card-header">
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 60))}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false) }}
            placeholder={`Eintrag #${(entryCount ?? 0) + 1}`}
            className="w-full border-0 border-b border-ring bg-transparent py-px text-base font-medium text-ink outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: title ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'none', border: 'none', padding: 0,
              cursor: 'text', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            {title || `Eintrag #${(entryCount ?? 0) + 1}`}
          </button>
        )}
        <span style={{
          fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {location && (
            <>
              <MapPin size={12} strokeWidth={1.75} aria-hidden />
              <span>{location}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span suppressHydrationWarning>{clock || '\u00a0'}</span>
        </span>
      </div>

      <div className="entry-card-columns">
        {/* Stimmungsfeld: quote + valence grid */}
        <section className="entry-card-valence" aria-label="Stimmungsfeld">
          <div className="entry-card-quote">
            <p
              className="text-quote"
              style={{
                opacity: quoteVisible ? 1 : 0,
                transition: quoteVisible ? 'opacity 350ms ease' : 'opacity 250ms ease',
              }}
            >
              &ldquo;{quote}&rdquo;
            </p>
          </div>
          <div className="entry-grid-wrap">
            <EntryGrid value={grid} onChange={setGrid} />
          </div>
        </section>

        {/* Compose: text + tags */}
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
                onBlur={(e) => {
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
                onClear={() => { chip.setValue(''); setOpenChip(null) }}
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
          onSelect={(label, state) => { setFeelingLabel(label); setBodyState(state) }}
          onClear={() => { setFeelingLabel(null); setBodyState(null) }}
        />
          </div>

          {saveSuccess && !savedEntry && (
            <p
              role="status"
              className="mb-3 rounded-lg border border-edge bg-subtle px-3 py-2.5 text-sm text-ink"
            >
              ✓ Eintrag gespeichert.
            </p>
          )}

          {saveError && (
            <p
              role="alert"
              className="mb-3 rounded-lg border border-[var(--danger)] px-3 py-2.5 text-sm text-danger"
              style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)' }}
            >
              {saveError}
            </p>
          )}

          {!savedEntry ? (
            <Button onClick={handleSubmit} disabled={!text.trim() || saving} size="lg" className="w-full">
              {saving ? 'Speichern…' : 'Eintragen →'}
            </Button>
          ) : (
            <ReframeFlow entry={savedEntry} onDone={finishAfterSave} />
          )}
        </section>
      </div>
    </div>
  )
}
