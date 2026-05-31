'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Entry, Category } from '@/lib/types'
import { ThemeToggle } from '@/components/theme-toggle'
import { DashboardTab } from '@/components/dashboard-tab'
import { AddEntryTab } from '@/components/add-entry-tab'
import { ReminderTab } from '@/components/reminder-tab'
import { EntryListTab } from '@/components/entry-list-tab'

type Tab = 'dashboard' | 'add' | 'reminder' | 'all'

const TAB_LABELS: Record<Exclude<Tab, 'add'>, string> = {
  dashboard: 'Übersicht',
  reminder: 'Erinnere mich',
  all: 'Alle Einträge',
}

const tabBtnBase =
  'rounded-full px-3.5 py-1.5 text-[13px] cursor-pointer font-inherit border border-solid whitespace-nowrap'

function tabBtnClass(active: boolean) {
  return active
    ? `${tabBtnBase} bg-primary text-primary-fg border-transparent`
    : `${tabBtnBase} bg-transparent text-muted border-border`
}

export function AppShell({
  initialEntries,
  user,
}: {
  initialEntries: Entry[]
  user: { id: string; email?: string }
}) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [reminder, setReminder] = useState<Entry | null>(
    initialEntries.length
      ? initialEntries[Math.floor(Math.random() * initialEntries.length)]
      : null
  )

  const pickReminder = useCallback(
    (pool?: Entry[]) => {
      const list = pool ?? entries
      if (!list.length) return
      setReminder(list[Math.floor(Math.random() * list.length)])
    },
    [entries]
  )

  async function addEntry(text: string, categories: Category[]) {
    const { data, error } = await supabase
      .from('entries')
      .insert({ text, categories, user_id: user.id })
      .select()
      .single()
    if (error || !data) return
    const updated = [data as Entry, ...entries]
    setEntries(updated)
    pickReminder(updated)
    setTab('reminder')
  }

  async function deleteEntry(id: string) {
    await supabase.from('entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Sticky header ────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-page border-b border-border shadow-sm">
        <div className="max-w-[560px] mx-auto px-4">

          {/* Row 1: title + theme toggle + add button */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-semibold">Meine Erfolge</h1>
              <span className="text-xs text-muted bg-badge rounded-full px-2.5 py-0.5">
                {entries.length}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setTab('add')}
                aria-label="Neuen Erfolg eintragen"
                className="w-8 h-8 rounded-full bg-primary text-primary-fg border-0 cursor-pointer font-inherit text-xl leading-none flex items-center justify-center shrink-0"
              >
                +
              </button>
            </div>
          </div>

          {/* Row 2: tab nav */}
          <div className="flex items-center gap-1.5 pb-3 overflow-x-auto">
            {(Object.keys(TAB_LABELS) as Exclude<Tab, 'add'>[]).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)} className={tabBtnClass(tab === t)}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* ── Scrollable content ───────────────────────────── */}
      <main className="flex-1 max-w-[560px] w-full mx-auto px-4 py-6 pb-28 sm:pb-8">
        {tab === 'dashboard' && (
          <DashboardTab entries={entries} onAddClick={() => setTab('add')} />
        )}
        {tab === 'add' && (
          <AddEntryTab onAdd={addEntry} />
        )}
        {tab === 'reminder' && (
          <ReminderTab reminder={reminder} hasEntries={entries.length > 0} onPickAnother={() => pickReminder()} />
        )}
        {tab === 'all' && (
          <EntryListTab entries={entries} onDelete={deleteEntry} onAddClick={() => setTab('add')} />
        )}
      </main>

      {/* ── Footer: sign-out ─────────────────────────────── */}
      <footer className="max-w-[560px] w-full mx-auto px-4 pb-6 sm:pb-4 flex justify-end">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs text-muted-light bg-transparent border-0 cursor-pointer"
        >
          Abmelden
        </button>
      </footer>

      {/* ── FAB: mobile add shortcut ─────────────────────── */}
      {tab !== 'add' && (
        <button
          type="button"
          onClick={() => setTab('add')}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:hidden z-30 bg-primary text-primary-fg border-0 cursor-pointer font-inherit rounded-full px-5 py-3 shadow-lg text-sm flex items-center gap-1.5 whitespace-nowrap"
        >
          <span aria-hidden>+</span>
          Neuer Erfolg
        </button>
      )}
    </div>
  )
}
