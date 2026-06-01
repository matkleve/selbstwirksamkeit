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
    <main style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            Selbstwirksamkeit
          </h1>
          <Nav />
          <SignOut />
        </header>

        {entries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9375rem', padding: 40 }}>
            Noch keine Einträge.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.map(entry => (
              <TimelineCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
