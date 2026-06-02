import { cache } from 'react'
import { getUserFromClaims } from '@/lib/auth-user'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ENTRY_SELECT } from '@/lib/entry-fields'
import type { Entry } from '@/lib/types'

export { ENTRY_SELECT }

/** One auth lookup per request (deduped). Prefers local JWT claims over network getUser(). */
export const getServerUser = cache(async () => {
  const supabase = await createServerSupabaseClient()
  const fromClaims = await getUserFromClaims(supabase)
  if (fromClaims) return fromClaims

  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/** Server-side entries fetch (use sparingly — main app loads entries in EntriesProvider). */
export const getServerEntries = cache(async (): Promise<Entry[]> => {
  const user = await getServerUser()
  if (!user) return []
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('entries')
    .select(ENTRY_SELECT)
    .order('created_at', { ascending: true })
  return (data ?? []) as Entry[]
})
