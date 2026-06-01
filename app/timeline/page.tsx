import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AppShell } from '@/components/AppShell'
import TimelineCard from '@/components/TimelineCard'
import type { Entry } from '@/lib/types'
import { getValenceColor } from '@/lib/types'

const ENTRY_SELECT = 'id,user_id,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at'

export default async function TimelinePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data } = await supabase.from('entries').select(ENTRY_SELECT).order('created_at', { ascending: false })
  const entries = (data ?? []) as Entry[]

  const byDate = entries.reduce<Record<string, Entry[]>>((acc, e) => {
    const d = e.created_at.slice(0, 10)
    if (!acc[d]) acc[d] = []
    acc[d].push(e)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <AppShell>
      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 24px' }}>
          Noch keine Einträge.
        </div>
      ) : (
        <>
          {/* Dot strip */}
          <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {dates.map(date => {
                const label = new Date(date + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
                return (
                  <div key={date} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 38, flexShrink: 0 }}>{label}</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {byDate[date].map(e => (
                        <div key={e.id} title={e.text.slice(0, 60)} style={{
                          width: 11, height: 11, borderRadius: 3,
                          background: getValenceColor(e.grid_x), opacity: 0.75, flexShrink: 0,
                        }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map(entry => <TimelineCard key={entry.id} entry={entry} />)}
          </div>
        </>
      )}
    </AppShell>
  )
}
