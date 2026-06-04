import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AppShell } from '@/components/AppShell'
import MirrorFlow from '@/components/MirrorFlow'
import { detectPattern } from '@/lib/patternDetection'
import type { Entry } from '@/lib/types'

const ENTRY_SELECT = 'id,user_id,title,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at'

export default async function MirrorPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data } = await supabase
    .from('entries')
    .select(ENTRY_SELECT)
    .order('created_at', { ascending: true })

  const entries = (data ?? []) as Entry[]
  const pattern = detectPattern(entries)

  return (
    <AppShell>
      <MirrorFlow pattern={pattern} />
    </AppShell>
  )
}
