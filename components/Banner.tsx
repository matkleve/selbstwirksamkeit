'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Entry } from '@/lib/types'
import { timeAgo } from '@/lib/utils'

export default function Banner() {
  const [successEntry, setSuccessEntry] = useState<Entry | null>(null)
  const [reframeEntry, setReframeEntry] = useState<Entry | null>(null)
  const [dismissed, setDismissed] = useState({ success: false, reframe: false })
  const supabase = createClient()

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('success-banner-shown')
    if (!alreadyShown) {
      fetchSuccess()
      sessionStorage.setItem('success-banner-shown', '1')
    }
    fetchReframe()
  }, [])

  const fetchSuccess = async () => {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const { data } = await supabase
      .from('entries')
      .select('id,user_id,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at')
      .gt('grid_x', 0)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)
    if (data && data.length > 0) {
      setSuccessEntry(data[Math.floor(Math.random() * data.length)] as Entry)
    }
  }

  const fetchReframe = async () => {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const { data } = await supabase
      .from('entries')
      .select('id,user_id,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at')
      .lt('grid_x', 0)
      .is('reframe', null)
      .lte('created_at', fourHoursAgo.toISOString())
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
    if (data && data.length > 0) {
      setReframeEntry(data[0] as Entry)
    }
  }

  const bannerStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '14px 16px',
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  }

  const closeBtn: React.CSSProperties = {
    color: 'var(--text-muted)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    flexShrink: 0,
    fontFamily: 'var(--font-body)',
  }

  const visible = (successEntry && !dismissed.success) || (reframeEntry && !dismissed.reframe)
  if (!visible) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      {successEntry && !dismissed.success && (
        <div style={bannerStyle}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {timeAgo(successEntry.created_at)}:
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: 4 }}>
              "{successEntry.text.length > 120 ? successEntry.text.slice(0, 120) + '…' : successEntry.text}"
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Das war erst {timeAgo(successEntry.created_at)}. Vertrau dir.
            </p>
          </div>
          <button onClick={() => setDismissed(d => ({ ...d, success: true }))} style={closeBtn}>✕</button>
        </div>
      )}

      {reframeEntry && !dismissed.reframe && (
        <div style={bannerStyle}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', flex: 1 }}>
            Du hattest heute etwas Schwieriges eingetragen. Hast du schon drüber nachgedacht, wie du das anders sehen könntest?
          </p>
          <button onClick={() => setDismissed(d => ({ ...d, reframe: true }))} style={closeBtn}>✕</button>
        </div>
      )}
    </div>
  )
}
