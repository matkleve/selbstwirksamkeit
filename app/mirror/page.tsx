import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AppShell } from '@/components/AppShell'
import MirrorFlow from '@/components/MirrorFlow'
import { detectTagFrequency, detectGridCluster } from '@/lib/patternDetection'
import type { Entry } from '@/lib/types'
import type { MirrorCandidate } from '@/lib/patternDetection'

const ENTRY_SELECT = 'id,user_id,title,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at'

export default async function MirrorPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // All entries for detection
  const { data: allEntries } = await supabase
    .from('entries')
    .select(ENTRY_SELECT)
    .order('created_at', { ascending: true })
  const entries = (allEntries ?? []) as Entry[]

  let candidate: MirrorCandidate | null = null

  // 1. Check for unshown persisted candidates
  const { data: stored } = await supabase
    .from('mirror_candidates')
    .select('*')
    .eq('shown', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (stored) {
    const { data: entryRows } = await supabase
      .from('entries')
      .select(ENTRY_SELECT)
      .in('id', stored.entry_ids as string[])
    const storedEntries = (entryRows ?? []) as Entry[]

    candidate = {
      entryIds: stored.entry_ids as string[],
      entries: storedEntries.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
      source: stored.source as MirrorCandidate['source'],
      signalStrength: stored.signal_strength as MirrorCandidate['signalStrength'],
      count: storedEntries.length,
      introText: stored.intro_text ?? '',
      question: stored.question ?? '',
    }

    await supabase
      .from('mirror_candidates')
      .update({ shown: true, shown_at: new Date().toISOString() })
      .eq('id', stored.id)
  } else {
    // 2. Run detectors live, prefer tag_frequency
    const detected = detectTagFrequency(entries) ?? detectGridCluster(entries)

    if (detected) {
      candidate = detected
      // Persist for future reference
      await supabase.from('mirror_candidates').insert({
        user_id: user.id,
        entry_ids: detected.entryIds,
        source: detected.source,
        signal_strength: detected.signalStrength,
        shown: true,
        shown_at: new Date().toISOString(),
      })
    }
  }

  return (
    <AppShell>
      <MirrorFlow candidate={candidate} />
    </AppShell>
  )
}
