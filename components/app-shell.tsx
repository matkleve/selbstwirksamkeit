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

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Übersicht',
  add: 'Neuer Eintrag',
  reminder: 'Erinnere mich',
  all: 'Alle Einträge',
}

const tabBtnBase =
  'rounded-full px-3.5 py-1.5 text-[13px] cursor-pointer font-inherit border border-solid'

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
              onClick={handleSignOut}
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
          <DashboardTab entries={entries} onAddClick={() => setTab('add')} />
        )}
        {tab === 'add' && (
          <AddEntryTab onAdd={addEntry} />
        )}
        {tab === 'reminder' && (
          <ReminderTab reminder={reminder} hasEntries={entries.length > 0} onPickAnother={() => pickReminder()} />
        )}
        {tab === 'all' && (
          <EntryListTab entries={entries} onDelete={deleteEntry} />
        )}
      </div>
    </div>
  )
}
