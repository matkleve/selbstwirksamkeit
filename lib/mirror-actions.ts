'use server'

import { redirect } from 'next/navigation'
import type { MirrorCandidate } from '@/lib/patternDetection'
import { fetchNextMirrorCandidate } from '@/lib/mirror-resolve'
import { getServerUser } from '@/lib/server-entries'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ENTRY_SELECT } from '@/lib/entry-fields'

export async function openMirrorCandidate(): Promise<MirrorCandidate | null> {
  const user = await getServerUser()
  if (!user) redirect('/')

  const supabase = await createServerSupabaseClient()
  const { data: entries } = await supabase
    .from('entries')
    .select(`${ENTRY_SELECT},embedding`)
    .order('created_at', { ascending: true })

  return fetchNextMirrorCandidate(supabase, user.id, entries ?? [])
}
