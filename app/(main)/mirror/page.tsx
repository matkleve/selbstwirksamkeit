import { redirect } from 'next/navigation'
import MirrorFlow from '@/components/MirrorFlow'
import { getServerUser, getServerEntries } from '@/lib/server-entries'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { resolveMirrorCandidate } from '@/lib/mirror-resolve'

export default async function MirrorPage() {
  const user = await getServerUser()
  if (!user) redirect('/')

  const entries = await getServerEntries()
  const supabase = await createServerSupabaseClient()
  const candidate = await resolveMirrorCandidate(supabase, user.id, entries)

  return <MirrorFlow candidate={candidate} />
}
