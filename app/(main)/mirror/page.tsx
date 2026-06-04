import { redirect } from 'next/navigation'
import { EntriesLoadingGate } from '@/components/EntriesLoadingGate'
import { MirrorPageView } from '@/components/mirror/MirrorPageView'
import { getServerUser } from '@/lib/server-entries'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ENTRY_SELECT } from '@/lib/entry-fields'
import type { MirrorSessionRow } from '@/lib/mirror-session'
import type { Entry } from '@/lib/types'

export default async function MirrorPage() {
  const user = await getServerUser()
  if (!user) redirect('/')

  const supabase = await createServerSupabaseClient()

  const { data: sessions } = await supabase
    .from('mirror_sessions')
    .select(
      'id, created_at, pattern_type, pattern_text, anchor_entry_ids, user_response, intention_wenn, intention_dann, is_favorited, signal_strength',
    )
    .order('is_favorited', { ascending: false })
    .order('created_at', { ascending: false })

  const sessionRows = (sessions ?? []) as MirrorSessionRow[]
  const anchorIds = [
    ...new Set(sessionRows.flatMap(s => s.anchor_entry_ids ?? [])),
  ]

  let entriesById: Record<string, Entry> = {}
  if (anchorIds.length) {
    const { data: entryRows } = await supabase
      .from('entries')
      .select(ENTRY_SELECT)
      .in('id', anchorIds)
    entriesById = Object.fromEntries((entryRows ?? []).map(e => [e.id, e as Entry]))
  }

  return (
    <EntriesLoadingGate>
      <MirrorPageView initialSessions={sessionRows} entriesById={entriesById} />
    </EntriesLoadingGate>
  )
}
