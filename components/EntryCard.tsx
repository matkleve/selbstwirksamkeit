'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import EntryGrid from './EntryGrid'
import ReframeFlow from './ReframeFlow'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getZone, zoneTexts, cardTintShadow } from '@/lib/gridZones'
import type { GridPoint, Entry, BodyState } from '@/lib/types'
import { formatDate, formatTime } from '@/lib/utils'

const BODY_STATE_LABELS: Record<BodyState, string> = {
  stressed: 'gestresst',
  calm: 'ruhig',
  tired: 'müde',
}

const CHIP_SELECT = 'id,user_id,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at'

export default function EntryCard() {
  const [grid, setGrid] = useState<GridPoint>({ x: 0, y: 0 })
  const [text, setText] = useState('')
  const [person, setPerson] = useState('')
  const [location, setLocation] = useState('')
  const [activity, setActivity] = useState('')
  const [bodyState, setBodyState] = useState<BodyState | null>(null)
  const [openChip, setOpenChip] = useState<'person' | 'location' | 'activity' | null>(null)
  const [quote, setQuote] = useState('')
  const [quoteVisible, setQuoteVisible] = useState(true)
  const [lastZone, setLastZone] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedEntry, setSavedEntry] = useState<Entry | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [userId, setUserId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState({ person: [] as string[], location: [] as string[], activity: [] as string[] })

  const supabase = createClient()

  useEffect(() => {
    const initial = zoneTexts[getZone(0, 0)]
    setQuote(initial[Math.floor(Math.random() * initial.length)])
    const id = setInterval(() => setNow(new Date()), 60_000)
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    Promise.all([
      supabase.from('persons').select('name').order('name'),
      supabase.from('locations').select('name').order('name'),
      supabase.from('activities').select('name').order('name'),
    ]).then(([p, l, a]) => setSuggestions({
      person: p.data?.map(r => r.name) ?? [],
      location: l.data?.map(r => r.name) ?? [],
      activity: a.data?.map(r => r.name) ?? [],
    }))
    return () => clearInterval(id)
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
    }, 200)
    return () => clearTimeout(t)
  }, [grid, lastZone])

  const tintShadow = cardTintShadow(grid.x, grid.y)
  const cardShadow = `0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.05), ${tintShadow}`

  const saveEntityNames = (uid: string) => {
    if (person.trim()) supabase.from('persons').upsert({ user_id: uid, name: person.trim() }, { onConflict: 'user_id,name', ignoreDuplicates: true }).then()
    if (location.trim()) supabase.from('locations').upsert({ user_id: uid, name: location.trim() }, { onConflict: 'user_id,name', ignoreDuplicates: true }).then()
    if (activity.trim()) supabase.from('activities').upsert({ user_id: uid, name: activity.trim() }, { onConflict: 'user_id,name', ignoreDuplicates: true }).then()
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('entries').insert({
      text: text.trim(), grid_x: grid.x, grid_y: grid.y,
      person: person.trim() || null, location: location.trim() || null,
      activity: activity.trim() || null, body_state: bodyState,
    }).select(CHIP_SELECT).single()
    setSaving(false)
    if (error || !data) return
    if (userId) saveEntityNames(userId)
    setSavedEntry(data as Entry)
    if (grid.x >= 0) reset()
  }

  const reset = () => {
    setText(''); setPerson(''); setLocation(''); setActivity('')
    setBodyState(null); setOpenChip(null)
    setGrid({ x: 0, y: 0 }); setSavedEntry(null)
  }

  const chips = [
    { key: 'person'   as const, icon: '👤', placeholder: 'z.B. Mama',    label: 'Person',    value: person,   setValue: setPerson },
    { key: 'location' as const, icon: '📍', placeholder: 'z.B. Büro',    label: 'Ort',       value: location, setValue: setLocation },
    { key: 'activity' as const, icon: '⚡', placeholder: 'z.B. Pendeln', label: 'Tätigkeit', value: activity, setValue: setActivity },
  ]

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-card)',
      padding: 24,
      boxShadow: cardShadow,
      transition: 'box-shadow 300ms ease',
    }}>
      {/* Meta header */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        {location && <><span>📍 {location}</span><span style={{ opacity: 0.4 }}>·</span></>}
        <span>{formatDate(now)} · {formatTime(now)}</span>
      </div>

      {/* Quote */}
      <div style={{ minHeight: 52, display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <p style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontStyle: 'italic',
          fontSize: '1.125rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
          opacity: quoteVisible ? 1 : 0,
          transition: 'opacity 200ms ease',
          margin: 0,
        }}>
          "{quote}"
        </p>
      </div>

      {/* Grid */}
      <div style={{ marginBottom: 20 }}>
        <EntryGrid value={grid} onChange={setGrid} />
      </div>

      {/* Textarea */}
      <div style={{ marginBottom: 14 }}>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Was geht dir durch den Kopf?"
          rows={3}
          style={{ minHeight: 84 }}
        />
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {chips.map(chip => {
          if (chip.value) {
            return (
              <button key={chip.key} onClick={() => { chip.setValue(''); setOpenChip(null) }} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                fontSize: '0.8125rem', fontFamily: 'inherit',
                background: 'var(--text-primary)', color: 'var(--text-inverse)',
                border: 'none', cursor: 'pointer',
              }}>
                {chip.icon} {chip.value} <span style={{ opacity: 0.5, fontSize: '0.6875rem' }}>✕</span>
              </button>
            )
          }
          if (openChip === chip.key) {
            return (
              <div key={chip.key} style={{ position: 'relative' }}>
                <input
                  autoFocus
                  list={`${chip.key}-list`}
                  value={chip.value}
                  onChange={e => chip.setValue(e.target.value.slice(0, 40))}
                  onBlur={() => { if (!chip.value) setOpenChip(null) }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setOpenChip(null) }}
                  placeholder={chip.placeholder}
                  style={{
                    width: 150, padding: '4px 10px', fontSize: '0.875rem',
                    border: '1px solid var(--border-focus)', borderRadius: 20,
                    background: 'var(--bg-card)', color: 'var(--text-primary)',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <datalist id={`${chip.key}-list`}>
                  {suggestions[chip.key].map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            )
          }
          return (
            <button key={chip.key} onClick={() => setOpenChip(chip.key)} className="btn-ghost" style={{ padding: '4px 11px', fontSize: '0.8125rem', height: 'auto' }}>
              + {chip.label}
            </button>
          )
        })}
      </div>

      {/* Body state */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Zustand</span>
        {(Object.keys(BODY_STATE_LABELS) as BodyState[]).map(state => (
          <button key={state} onClick={() => setBodyState(bodyState === state ? null : state)} style={{
            padding: '3px 11px', borderRadius: 20,
            fontSize: '0.8125rem', fontFamily: 'inherit',
            border: `1.5px solid ${bodyState === state ? 'var(--border-focus)' : 'var(--border)'}`,
            background: bodyState === state ? 'var(--bg-subtle)' : 'transparent',
            color: bodyState === state ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 120ms ease',
          }}>
            {BODY_STATE_LABELS[state]}
          </button>
        ))}
      </div>

      {!savedEntry ? (
        <Button onClick={handleSubmit} disabled={!text.trim() || saving} size="lg" className="w-full">
          {saving ? 'Speichern…' : 'Eintragen →'}
        </Button>
      ) : (
        <ReframeFlow entry={savedEntry} onDone={reset} />
      )}
    </div>
  )
}
