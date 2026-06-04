import { redirect } from 'next/navigation'
import MirrorFlow from '@/components/MirrorFlow'
import { getServerUser, getServerEntries } from '@/lib/server-entries'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { detectPattern, candidateFromStored } from '@/lib/patternDetection'
import type { MirrorCandidate } from '@/lib/patternDetection'

export default async function MirrorPage() {
  const user = await getServerUser()
  if (!user) redirect('/')

  const entries = await getServerEntries()
  const supabase = await createServerSupabaseClient()

  let candidate: MirrorCandidate | null = null

  const { data: stored } = await supabase
    .from('mirror_candidates')
    .select('*')
    .eq('shown', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (stored) {
    const { data: entryRows } = await supabase
      .from('entries')
      .select('*')
      .in('id', stored.entry_ids as string[])

    if (entryRows?.length) {
      candidate = candidateFromStored(stored, entryRows)

      await supabase
        .from('mirror_candidates')
        .update({ shown: true, shown_at: new Date().toISOString() })
        .eq('id', stored.id)
    }
  } else {
    const detected = detectPattern(entries)

    if (detected) {
      candidate = detected
      await supabase.from('mirror_candidates').insert({
        user_id: user.id,
        entry_ids: detected.entryIds,
        source: detected.source,
        signal_strength: detected.signalStrength,
        intro_text: detected.introText,
        question: detected.question,
        shown: true,
        shown_at: new Date().toISOString(),
      })
    }
  }

  return <MirrorFlow candidate={candidate} />
}
