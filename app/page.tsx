'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import {
  timeAgo, nudgeText, isToday, calcStreak,
  getPasswordChecks, isPasswordValid,
} from '@/lib/utils'
import type { Entry, Category } from '@/lib/types'
import { ThemeToggle } from '@/components/theme-toggle'

const CATEGORIES: Category[] = [
  'allgemein', 'studium', 'arbeit / bewerbung', 'projekt', 'persönlich',
]

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Übersicht',
  add: 'Neuer Eintrag',
  reminder: 'Erinnere mich',
  all: 'Alle Einträge',
}

type Tab = 'dashboard' | 'add' | 'reminder' | 'all'

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2.5 text-[15px] font-inherit outline-none bg-surface text-foreground'
const cardClass = 'bg-card border border-border rounded-xl p-5 mb-4'
const labelClass = 'text-[11px] text-muted uppercase tracking-wider mb-2.5'
const primaryBtnClass =
  'bg-primary text-primary-fg border-0 rounded-lg px-[18px] py-2 text-sm cursor-pointer font-inherit disabled:opacity-45 disabled:cursor-not-allowed'
const ghostBtnClass =
  'bg-transparent text-muted border border-border rounded-lg px-[18px] py-2 text-sm cursor-pointer font-inherit'
const tabBtnBase =
  'rounded-full px-3.5 py-1.5 text-[13px] cursor-pointer font-inherit border border-solid'

function tabBtnClass(active: boolean) {
  return active
    ? `${tabBtnBase} bg-primary text-primary-fg border-transparent`
    : `${tabBtnBase} bg-transparent text-muted border-border`
}

function tagBtnClass(selected: boolean) {
  return selected
    ? 'text-xs px-3 py-1 rounded-full cursor-pointer font-inherit border border-accent text-accent bg-accent-light'
    : 'text-xs px-3 py-1 rounded-full cursor-pointer font-inherit border border-border text-muted bg-transparent'
}

export default function HomePage() {
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('dashboard')
  const [entries, setEntries] = useState<Entry[]>([])
  const [text, setText] = useState('')
  const [categories, setCategories] = useState<Category[]>(['allgemein'])
  const [reminder, setReminder] = useState<Entry | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)

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

  const loadEntries = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false })
    setEntries((data as Entry[]) ?? [])
  }, [user])

  useEffect(() => { loadEntries() }, [loadEntries])

  const pickReminder = useCallback((pool?: Entry[]) => {
    const list = pool ?? entries
    if (!list.length) return
    setReminder(list[Math.floor(Math.random() * list.length)])
  }, [entries])

  useEffect(() => {
    if (tab === 'reminder') pickReminder()
  }, [tab])

  const passwordChecks = getPasswordChecks(password)
  const passwordOk = isPasswordValid(password)
  const showPasswordHints = authMode === 'signup' && password.length > 0

  function toggleCategory(cat: Category) {
    setCategories(prev => {
      if (prev.includes(cat)) {
        const next = prev.filter(c => c !== cat)
        return next.length > 0 ? next : prev
      }
      return [...prev, cat]
    })
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    if (authMode === 'signup' && !passwordOk) {
      setAuthError('Bitte erfülle alle Passwort-Anforderungen.')
      return
    }
    const fn = authMode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { error } = await fn
    if (error) setAuthError(error.message)
  }

  async function addEntry() {
    if (!text.trim() || !user || categories.length === 0) return
    const { data, error } = await supabase
      .from('entries')
      .insert({ text: text.trim(), categories, user_id: user.id })
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
        <span className="text-accent text-sm">Laden…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-[380px] relative">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <h1 className="text-xl font-medium mb-1 pr-24">Selbstwirksamkeit</h1>
          <p className="text-sm text-muted mb-6">Dein persönliches Erfolgs-Journal</p>
          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError('') }}
              className={`${inputClass} ${showPasswordHints && !passwordOk ? 'border-[var(--hint-warn-border)]' : ''}`}
              aria-describedby={showPasswordHints ? 'password-hints' : undefined}
            />
            {showPasswordHints && (
              <ul id="password-hints" className="m-0 p-0 list-none flex flex-col gap-1">
                {passwordChecks.map(rule => (
                  <li
                    key={rule.id}
                    className={`text-xs flex items-center gap-1.5 ${rule.met ? 'text-hint-ok' : 'text-muted'}`}
                  >
                    <span aria-hidden className="text-[11px]">{rule.met ? '✓' : '○'}</span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
            {authError && <p className="text-[13px] text-danger">{authError}</p>}
            <button
              type="submit"
              disabled={authMode === 'signup' && !passwordOk}
              className={primaryBtnClass}
            >
              {authMode === 'login' ? 'Anmelden' : 'Registrieren'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => { setAuthMode(m => m === 'login' ? 'signup' : 'login'); setAuthError('') }}
            className="mt-4 text-[13px] text-muted bg-transparent border-0 cursor-pointer p-0"
          >
            {authMode === 'login' ? 'Noch kein Konto? Registrieren →' : 'Bereits registriert? Anmelden →'}
          </button>
        </div>
      </div>
    )
  }

  const todayEntries = entries.filter(e => isToday(e.created_at))
  const streak = calcStreak(entries)

  const pickFrom = (minDays: number, maxDays: number) => {
    const pool = entries.filter(e => {
      const d = (Date.now() - new Date(e.created_at).getTime()) / 86400000
      return d >= minDays && d < maxDays
    })
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
  }
  const memories = [pickFrom(1, 7), pickFrom(7, 30), pickFrom(30, 365)].filter(Boolean) as Entry[]

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-[560px] mx-auto">

        <div className="flex justify-between items-start gap-3 mb-6 flex-wrap">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h1 className="text-xl font-medium">Meine Erfolge</h1>
            <span className="text-xs text-muted bg-badge rounded-full px-2.5 py-0.5">
              {entries.length} Eintrag{entries.length !== 1 ? 'e' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-muted-light bg-transparent border-0 cursor-pointer"
            >
              Abmelden
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {(['dashboard', 'add', 'reminder', 'all'] as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} className={tabBtnClass(tab === t)}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className={`${cardClass} mb-0 text-center`}>
                <div className="text-[32px] font-semibold leading-none">{todayEntries.length}</div>
                <div className="text-xs text-muted mt-1">
                  {todayEntries.length === 1 ? 'Erfolg heute' : 'Erfolge heute'}
                </div>
              </div>
              <div className={`${cardClass} mb-0 text-center`}>
                <div className="text-[32px] font-semibold leading-none">{streak}</div>
                <div className="text-xs text-muted mt-1">
                  {streak === 1 ? 'Tag in Folge' : 'Tage in Folge'}
                </div>
              </div>
            </div>

            {todayEntries.length > 0 && (
              <div className={`${cardClass} mb-4`}>
                <div className={labelClass}>Heute eingetragen</div>
                {todayEntries.map(e => (
                  <div
                    key={e.id}
                    className="border-l-2 border-accent pl-3 mb-2 text-[15px] leading-snug last:mb-0"
                  >
                    {e.text}
                    <CategoryPills categories={e.categories ?? []} className="mt-0.5" />
                  </div>
                ))}
              </div>
            )}

            {memories.length > 0 && (
              <>
                <div className={`${labelClass} mb-2.5`}>Erinnerst du dich noch?</div>
                {memories.map(m => (
                  <div
                    key={m.id}
                    className={`${cardClass} mb-2.5 border-l-2 border-accent rounded-l-none rounded-r-xl`}
                  >
                    <p className="text-[15px] italic leading-relaxed mb-1.5">&ldquo;{m.text}&rdquo;</p>
                    <p className="text-xs">
                      <span className="text-accent font-medium">{nudgeText(m.created_at)}</span>
                      {' '}
                      <span className="text-muted">— {timeAgo(m.created_at)}</span>
                    </p>
                  </div>
                ))}
              </>
            )}

            {entries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted text-sm mb-4">Noch keine Einträge. Fang jetzt an!</p>
                <button type="button" onClick={() => setTab('add')} className={primaryBtnClass}>
                  + Ersten Erfolg eintragen
                </button>
              </div>
            )}

            {entries.length > 0 && (
              <button type="button" onClick={() => setTab('add')} className={`${primaryBtnClass} w-full mt-1`}>
                + Neuen Erfolg eintragen
              </button>
            )}
          </>
        )}

        {tab === 'add' && (
          <div className={cardClass}>
            <div className={labelClass}>Was habe ich heute geschafft?</div>
            <p className="text-[11px] text-muted mb-1.5">Tags (mehrere möglich)</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={tagBtnClass(categories.includes(cat))}>
                  {cat}
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="z.B. Mathe-Test gemacht, obwohl ich keine Lust hatte…"
              rows={3}
              className={`${inputClass} resize-none`}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addEntry() }}
            />
            <div className="flex gap-2 mt-2.5">
              <button type="button" onClick={addEntry} className={primaryBtnClass}>+ Eintragen</button>
              <button type="button" onClick={() => setText('')} className={ghostBtnClass}>Löschen</button>
            </div>
            <p className="text-[11px] text-muted-light mt-2">⌘ + Enter zum Speichern</p>
          </div>
        )}

        {tab === 'reminder' && (
          <>
            {entries.length === 0 ? (
              <p className="text-muted text-sm text-center py-8">Noch keine Einträge. Trag etwas ein!</p>
            ) : reminder && (
              <div className={`${cardClass} border-l-2 border-accent rounded-l-none rounded-r-xl`}>
                <div className={`${labelClass} mb-2`}>Erinnerst du dich noch?</div>
                <p className="text-base leading-relaxed italic mb-2.5">&ldquo;{reminder.text}&rdquo;</p>
                <p className="text-[13px]">
                  <span className="text-accent font-medium">{nudgeText(reminder.created_at)}</span>
                  {' '}
                  <span className="text-muted">— {timeAgo(reminder.created_at)}</span>
                </p>
              </div>
            )}
            <button type="button" onClick={() => pickReminder()} className={`${ghostBtnClass} w-full mt-3`}>
              ↻ Andere Erinnerung
            </button>
          </>
        )}

        {tab === 'all' && (
          <>
            {entries.length === 0 ? (
              <p className="text-muted text-sm text-center py-8">Noch keine Einträge.</p>
            ) : (
              entries.map(e => (
                <div
                  key={e.id}
                  className="border-l-2 border-accent bg-surface py-3.5 px-4 mb-3 rounded-l-none rounded-r-lg"
                >
                  <p className="text-[15px] leading-relaxed mb-1.5">{e.text}</p>
                  <div className="text-xs text-muted flex flex-wrap items-center gap-2">
                    <span className="text-accent">{timeAgo(e.created_at)}</span>
                    <span>·</span>
                    <CategoryPills categories={e.categories ?? []} />
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => deleteEntry(e.id)}
                      className="text-xs text-muted-light bg-transparent border-0 cursor-pointer p-0 underline"
                    >
                      löschen
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CategoryPills({ categories, className = '' }: { categories: Category[]; className?: string }) {
  if (!categories.length) return null
  return (
    <span className={`flex flex-wrap gap-1 ${className}`}>
      {categories.map(cat => (
        <span key={cat} className="text-[11px] text-accent bg-accent-light rounded-full px-2 py-0.5">
          {cat}
        </span>
      ))}
    </span>
  )
}
