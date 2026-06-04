import { redirect } from 'next/navigation'
import MirrorFlow from '@/components/MirrorFlow'
import { getServerUser } from '@/lib/server-entries'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { resolveMirrorCandidate } from '@/lib/mirror-resolve'
import { ENTRY_SELECT } from '@/lib/entry-fields'

export default async function MirrorPage() {
  const user = await getServerUser()
  if (!user) redirect('/')

  const supabase = await createServerSupabaseClient()
  const { data: entries } = await supabase
    .from('entries')
    .select(`${ENTRY_SELECT},embedding`)
    .order('created_at', { ascending: true })

  const candidate = await resolveMirrorCandidate(supabase, user.id, entries ?? [])

  return <MirrorFlow candidate={candidate} />
}
