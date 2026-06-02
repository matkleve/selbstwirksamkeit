'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase'
import { ENTRY_SELECT } from '@/lib/entry-fields'
import type { Entry } from '@/lib/types'

interface EntriesContextValue {
  entries: Entry[]
  loading: boolean
  refresh: () => Promise<void>
  /** Chronological index (1-based), oldest entry = 1 */
  entryNumber: (id: string) => number | null
}

const EntriesContext = createContext<EntriesContextValue | null>(null)

async function fetchEntries(): Promise<Entry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('entries')
    .select(ENTRY_SELECT)
    .order('created_at', { ascending: true })
  return (data ?? []) as Entry[]
}

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const loadStarted = useRef(false)

  useEffect(() => {
    if (loadStarted.current) return
    loadStarted.current = true
    let cancelled = false
    fetchEntries()
      .then(data => {
        if (!cancelled) setEntries(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setEntries(await fetchEntries())
    } finally {
      setLoading(false)
    }
  }, [])

  const entryNumber = useCallback(
    (id: string) => {
      const idx = entries.findIndex(e => e.id === id)
      return idx >= 0 ? idx + 1 : null
    },
    [entries],
  )

  const value = useMemo(
    () => ({ entries, loading, refresh, entryNumber }),
    [entries, loading, refresh, entryNumber],
  )

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
