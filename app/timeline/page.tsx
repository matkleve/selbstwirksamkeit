import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import SignOut from '@/components/SignOut'
import TimelineCard from '@/components/TimelineCard'
import type { Entry } from '@/lib/types'

const ENTRY_SELECT = 'id,user_id,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at'

export default async function TimelinePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data } = await supabase
    .from('entries')
    .select(ENTRY_SELECT)
    .order('created_at', { ascending: false })

  const entries = (data ?? []) as Entry[]

  return (
    <main className="page">
      <div className="page-inner">
        <header className="page-header">
          <h1 className="page-title">Selbstwirksamkeit</h1>
          <Nav />
          <SignOut />
        </header>

        {entries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 24px' }}>
            Noch keine Einträge.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map(entry => (
              <TimelineCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
