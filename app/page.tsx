'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { timeAgo, nudgeText } from '@/lib/utils'
import type { Entry, Category } from '@/lib/types'

const CATEGORIES: Category[] = [
  'allgemein', 'studium', 'arbeit / bewerbung', 'projekt', 'persönlich'
]

type Tab = 'add' | 'reminder' | 'all'

export default function HomePage() {
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('add')
  const [entries, setEntries] = useState<Entry[]>([])
  const [text, setText] = useState('')
  const [category, setCategory] = useState<Category>('allgemein')
  const [reminder, setReminder] = useState<Entry | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load entries when user is set
  const loadEntries = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false })
    setEntries((data as Entry[]) ?? [])
  }, [user])

  useEffect(() => { loadEntries() }, [loadEntries])

  // Pick random reminder
  const pickReminder = useCallback((pool?: Entry[]) => {
    const list = pool ?? entries
    if (!list.length) return
    setReminder(list[Math.floor(Math.random() * list.length)])
  }, [entries])

  useEffect(() => {
    if (tab === 'reminder') pickReminder()
  }, [tab])

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    const fn = authMode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { error } = await fn
    if (error) setAuthError(error.message)
  }

  async function addEntry() {
    if (!text.trim() || !user) return
    const { data, error } = await supabase
      .from('entries')
      .insert({ text: text.trim(), category, user_id: user.id })
      .select()
      .single()
    if (error || !data) return
    const newEntry = data as Entry
    const updated = [newEntry, ...entries]
    setEntries(updated)
    setText('')
    setTab('reminder')
    pickReminder(updated)
  }

  async function deleteEntry(id: string) {
    await supabase.from('entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span style={{ color: 'var(--accent)', fontSize: 14 }}>Laden…</span>
      </div>
    )
  }

  // ── Auth screen ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div style={{
          background: 'white', border: '0.5px solid #e0dbd4',
          borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 380
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>Selbstwirksamkeit</h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Dein persönliches Erfolgs-Journal</p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email" placeholder="E-Mail" value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password" placeholder="Passwort" value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
            {authError && <p style={{ fontSize: 13, color: '#c0392b' }}>{authError}</p>}
            <button type="submit" style={primaryBtn}>
              {authMode === 'login' ? 'Anmelden' : 'Registrieren'}
            </button>
          </form>

          <button
            onClick={() => setAuthMode(m => m === 'login' ? 'signup' : 'login')}
            style={{ marginTop: 16, fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {authMode === 'login' ? 'Noch kein Konto? Registrieren →' : 'Bereits registriert? Anmelden →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Main app ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 500 }}>Meine Erfolge</h1>
            <span style={{
              fontSize: 12, color: '#888', background: '#f0ece6',
              borderRadius: 20, padding: '2px 10px'
            }}>{entries.length} Eintrag{entries.length !== 1 ? 'e' : ''}</span>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ fontSize: 12, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Abmelden
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
          {(['add', 'reminder', 'all'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              ...tabBtn,
              background: tab === t ? '#1a1a1a' : 'transparent',
              color: tab === t ? 'white' : '#888',
              borderColor: tab === t ? 'transparent' : '#e0dbd4',
            }}>
              {{ add: 'Neuer Eintrag', reminder: 'Erinnere mich', all: 'Alle Einträge' }[t]}
            </button>
          ))}
        </div>

        {/* ── Add tab ── */}
        {tab === 'add' && (
          <div style={card}>
            <div style={label}>Was habe ich heute geschafft?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                  border: `0.5px solid ${category === cat ? 'var(--accent)' : '#e0dbd4'}`,
                  color: category === cat ? 'var(--accent)' : '#888',
                  background: 'transparent', fontFamily: 'inherit'
                }}>{cat}</button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="z.B. Mathe-Test gemacht, obwohl ich keine Lust hatte…"
              rows={3}
              style={{
                width: '100%', border: '0.5px solid #e0dbd4', borderRadius: 8,
                padding: '10px 12px', fontSize: 15, fontFamily: 'inherit',
                resize: 'none', outline: 'none', background: '#faf9f7',
                color: 'inherit'
              }}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addEntry() }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={addEntry} style={primaryBtn}>+ Eintragen</button>
              <button onClick={() => setText('')} style={ghostBtn}>Löschen</button>
            </div>
            <p style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>⌘ + Enter zum Speichern</p>
          </div>
        )}

        {/* ── Reminder tab ── */}
        {tab === 'reminder' && (
          <>
            {entries.length === 0
              ? <p style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: '2rem 0' }}>Noch keine Einträge. Trag etwas ein!</p>
              : reminder && (
                <div style={{ ...card, borderLeft: '2px solid var(--accent)', borderRadius: '0 12px 12px 0' }}>
                  <div style={{ ...label, marginBottom: 8 }}>Erinnerst du dich noch?</div>
                  <p style={{ fontSize: 16, lineHeight: 1.65, fontStyle: 'italic', marginBottom: 10 }}>
                    "{reminder.text}"
                  </p>
                  <p style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{nudgeText(reminder.created_at)}</span>
                    {' '}
                    <span style={{ color: '#aaa' }}>— {timeAgo(reminder.created_at)}</span>
                  </p>
                </div>
              )
            }
            <button onClick={() => pickReminder()} style={{ ...ghostBtn, width: '100%', marginTop: 12 }}>
              ↻ Andere Erinnerung
            </button>
          </>
        )}

        {/* ── All entries tab ── */}
        {tab === 'all' && (
          <>
            {entries.length === 0
              ? <p style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: '2rem 0' }}>Noch keine Einträge.</p>
              : entries.map(e => (
                <div key={e.id} style={{
                  borderLeft: '2px solid var(--accent)', background: '#faf9f7',
                  padding: '0.875rem 1.125rem', marginBottom: '0.75rem',
                  borderRadius: '0 8px 8px 0'
                }}>
                  <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 6 }}>{e.text}</p>
                  <div style={{ fontSize: 12, color: '#aaa', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent)' }}>{timeAgo(e.created_at)}</span>
                    <span>·</span>
                    <span>{e.category}</span>
                    <span>·</span>
                    <button onClick={() => deleteEntry(e.id)} style={{
                      fontSize: 12, color: '#ccc', background: 'none',
                      border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline'
                    }}>löschen</button>
                  </div>
                </div>
              ))
            }
          </>
        )}
      </div>
    </div>
  )
}

// ── Style constants ──────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', border: '0.5px solid #e0dbd4', borderRadius: 8,
  padding: '10px 12px', fontSize: 15, fontFamily: 'inherit', outline: 'none',
  background: '#faf9f7', color: 'inherit'
}
const card: React.CSSProperties = {
  background: 'white', border: '0.5px solid #e0dbd4',
  borderRadius: 12, padding: '1.25rem', marginBottom: '1rem'
}
const label: React.CSSProperties = { fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }
const primaryBtn: React.CSSProperties = {
  background: '#1a1a1a', color: 'white', border: 'none',
  borderRadius: 8, padding: '8px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
}
const ghostBtn: React.CSSProperties = {
  background: 'transparent', color: '#888', border: '0.5px solid #e0dbd4',
  borderRadius: 8, padding: '8px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
}
const tabBtn: React.CSSProperties = {
  borderRadius: 20, padding: '5px 14px', fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit', border: '0.5px solid'
}
