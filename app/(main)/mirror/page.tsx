import { redirect } from 'next/navigation'
import { EntriesLoadingGate } from '@/components/EntriesLoadingGate'
import { MirrorPageView } from '@/components/mirror/MirrorPageView'
import { getServerUser } from '@/lib/server-entries'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fetchMirrorHistory } from '@/lib/mirror-session'

export default async function MirrorPage() {
  const user = await getServerUser()
  if (!user) redirect('/')

  const supabase = await createServerSupabaseClient()
  const { sessions, entriesById } = await fetchMirrorHistory(supabase)

  return (
    <EntriesLoadingGate>
      <MirrorPageView initialSessions={sessions} entriesById={entriesById} />
    </EntriesLoadingGate>
  )
}
