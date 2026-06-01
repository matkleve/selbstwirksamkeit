'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase'
import { ENTRY_SELECT } from '@/lib/entry-fields'
import type { Entry } from '@/lib/types'

interface EntriesContextValue {
  entries: Entry[]
  refresh: () => Promise<void>
}

const EntriesContext = createContext<EntriesContextValue | null>(null)

export function EntriesProvider({
  initialEntries,
  children,
}: {
  initialEntries: Entry[]
  children: ReactNode
}) {
  const [entries, setEntries] = useState(initialEntries)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('entries')
      .select(ENTRY_SELECT)
      .order('created_at', { ascending: true })
    setEntries((data ?? []) as Entry[])
  }, [])

  const value = useMemo(() => ({ entries, refresh }), [entries, refresh])

  return (
    <EntriesContext.Provider value={value}>
      {children}
    </EntriesContext.Provider>
  )
}

export function useEntries() {
  const ctx = useContext(EntriesContext)
  if (!ctx) throw new Error('useEntries must be used within EntriesProvider')
  return ctx
}
