'use client'

import type { ReactNode } from 'react'
import MainLoading from '@/app/(main)/loading'
import { useEntries } from '@/components/EntriesProvider'

/** Skeleton while the one-time client entries fetch runs (tab switches reuse cached state). */
export function EntriesLoadingGate({ children }: { children: ReactNode }) {
  const { loading, entries } = useEntries()
  if (loading && entries.length === 0) return <MainLoading />
  return children
}
