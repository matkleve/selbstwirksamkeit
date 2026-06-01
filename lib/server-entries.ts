import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ENTRY_SELECT } from '@/lib/entry-fields'
import type { Entry } from '@/lib/types'

export { ENTRY_SELECT }

/** One auth lookup per request (deduped across layout + pages) */
export const getServerUser = cache(async () => {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/** One entries fetch per request when user is logged in */
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
