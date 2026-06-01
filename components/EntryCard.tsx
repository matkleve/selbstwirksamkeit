'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import EntryGrid from './EntryGrid'
import ReframeFlow from './ReframeFlow'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { quadrantTexts } from '@/lib/quadrantTexts'
import type { GridPoint, Entry, BodyState } from '@/lib/types'
import { formatDate, formatTime } from '@/lib/utils'

function getQuadrantKey(p: GridPoint): keyof typeof quadrantTexts {
  if (p.x >= 0 && p.y >= 0) return 'pos-other'
  if (p.x >= 0 && p.y < 0)  return 'pos-self'
  if (p.x < 0  && p.y >= 0) return 'neg-other'
  return 'neg-self'
}

const BODY_STATE_LABELS: Record<BodyState, string> = {
  stressed: 'gestresst',
  calm: 'ruhig',
  tired: 'müde',
}

const CHIP_SELECT = 'id,user_id,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at'

export default function EntryCard() {
  const [grid, setGrid] = useState<GridPoint>({ x: 1, y: 0 })
  const [text, setText] = useState('')
  const [person, setPerson] = useState('')
  const [location, setLocation] = useState('')
  const [activity, setActivity] = useState('')
  const [bodyState, setBodyState] = useState<BodyState | null>(null)
  const [openChip, setOpenChip] = useState<'person' | 'location' | 'activity' | null>(null)
  const [quote, setQuote] = useState(quadrantTexts['pos-self'][0])
  const [quoteVisible, setQuoteVisible] = useState(true)
  const [lastQuadrant, setLastQuadrant] = useState<string>('pos-self')
  const [saving, setSaving] = useState(false)
  const [savedEntry, setSavedEntry] = useState<Entry | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [userId, setUserId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState({
    person: [] as string[],
    location: [] as string[],
    activity: [] as string[],
  })

  const supabase = createClient()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    Promise.all([
      supabase.from('persons').select('name').order('name'),
      supabase.from('locations').select('name').order('name'),
      supabase.from('activities').select('name').order('name'),
    ]).then(([p, l, a]) => {
      setSuggestions({
        person: p.data?.map(r => r.name) ?? [],
        location: l.data?.map(r => r.name) ?? [],
        activity: a.data?.map(r => r.name) ?? [],
      })
    })
  }, [])

  useEffect(() => {
    const quadrant = getQuadrantKey(grid)
    if (quadrant === lastQuadrant) return
    setQuoteVisible(false)
    const t = setTimeout(() => {
      const texts = quadrantTexts[quadrant]
      setQuote(texts[Math.floor(Math.random() * texts.length)])
      setLastQuadrant(quadrant)
      setQuoteVisible(true)
    }, 200)
    return () => clearTimeout(t)
  }, [grid, lastQuadrant])

  const saveEntityNames = (uid: string) => {
    if (person.trim()) {
      supabase.from('persons').upsert({ user_id: uid, name: person.trim() }, { onConflict: 'user_id,name', ignoreDuplicates: true }).then()
    }
    if (location.trim()) {
      supabase.from('locations').upsert({ user_id: uid, name: location.trim() }, { onConflict: 'user_id,name', ignoreDuplicates: true }).then()
    }
    if (activity.trim()) {
      supabase.from('activities').upsert({ user_id: uid, name: activity.trim() }, { onConflict: 'user_id,name', ignoreDuplicates: true }).then()
    }
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('entries')
      .insert({
        text: text.trim(),
        grid_x: grid.x,
        grid_y: grid.y,
        person: person.trim() || null,
        location: location.trim() || null,
        activity: activity.trim() || null,
        body_state: bodyState,
      })
      .select(CHIP_SELECT)
      .single()
    setSaving(false)
    if (error || !data) return
    if (userId) saveEntityNames(userId)
    setSavedEntry(data as Entry)
    if (grid.x >= 0) reset()
  }

  const reset = () => {
    setText('')
    setPerson('')
    setLocation('')
    setActivity('')
    setBodyState(null)
    setOpenChip(null)
    setGrid({ x: 1, y: 0 })
    setSavedEntry(null)
  }

  const chips: Array<{
    key: 'person' | 'location' | 'activity'
    icon: string
    placeholder: string
    label: string
    value: string
    setValue: (v: string) => void
  }> = [
    { key: 'person',   icon: '👤', placeholder: 'z.B. Mama',    label: 'Person',    value: person,   setValue: setPerson },
    { key: 'location', icon: '📍', placeholder: 'z.B. Büro',    label: 'Ort',       value: location, setValue: setLocation },
    { key: 'activity', icon: '⚡', placeholder: 'z.B. Pendeln', label: 'Tätigkeit', value: activity, setValue: setActivity },
  ]

  return (
    <div className="card" style={{ padding: 28 }}>
      {/* Meta header */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20, color: 'var(--text-muted)', fontSize: '0.8125rem', letterSpacing: '0.01em' }}>
        {location && <><span>📍 {location}</span><span style={{ opacity: 0.4 }}>·</span></>}
        <span>{formatDate(now)} · {formatTime(now)}</span>
      </div>

      {/* Quote */}
      <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <p style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontStyle: 'italic',
          fontSize: '1.1875rem',
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          opacity: quoteVisible ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}>
          "{quote}"
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <EntryGrid value={grid} onChange={setGrid} />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 280, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.01em' }}>
          <span>← schwierig</span>
          <span>gut →</span>
        </div>
      </div>

      {/* Textarea */}
      <div style={{ marginBottom: 16 }}>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Was geht dir durch den Kopf?"
          rows={3}
          style={{ minHeight: 88 }}
        />
      </div>

      {/* Optional chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {chips.map(chip => {
          if (chip.value) {
            return (
              <button
                key={chip.key}
                onClick={() => { chip.setValue(''); setOpenChip(null) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 20,
                  fontSize: '0.8125rem', fontFamily: 'inherit',
                  background: 'var(--text-primary)', color: 'var(--text-inverse)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {chip.icon} {chip.value}
                <span style={{ opacity: 0.55, fontSize: '0.75rem' }}>✕</span>
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
                    width: 160, padding: '5px 11px', fontSize: '0.875rem',
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
            <button
              key={chip.key}
              onClick={() => setOpenChip(chip.key)}
              className="btn-ghost"
              style={{ padding: '5px 12px', fontSize: '0.8125rem', height: 'auto' }}
            >
              + {chip.label}
            </button>
          )
        })}
      </div>

      {/* Body state */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginRight: 2 }}>Zustand</span>
        {(Object.keys(BODY_STATE_LABELS) as BodyState[]).map(state => (
          <button
            key={state}
            onClick={() => setBodyState(bodyState === state ? null : state)}
            style={{
              padding: '4px 11px', borderRadius: 20,
              fontSize: '0.8125rem', fontFamily: 'inherit',
              border: `1.5px solid ${bodyState === state ? 'var(--border-focus)' : 'var(--border)'}`,
              background: bodyState === state ? 'var(--bg-subtle)' : 'transparent',
              color: bodyState === state ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {BODY_STATE_LABELS[state]}
          </button>
        ))}
      </div>

      {/* Submit / ReframeFlow */}
      {!savedEntry ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleSubmit} disabled={!text.trim() || saving} size="lg">
            {saving ? 'Speichern…' : 'Eintragen →'}
          </Button>
        </div>
      ) : (
        <ReframeFlow entry={savedEntry} onDone={reset} />
      )}
    </div>
  )
}
