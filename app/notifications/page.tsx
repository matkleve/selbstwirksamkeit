'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { Bell, BellOff, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotificationsPage() {
  const [enabled, setEnabled] = useState(false)
  const [time, setTime] = useState('20:00')
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') setEnabled(true)
  }

  const card: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', padding: 20, marginBottom: 14 }
  const sectionLabel: React.CSSProperties = { fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }

  return (
    <AppShell>
      {/* Daily reminder */}
      <div style={card}>
        <p style={sectionLabel}>Tägliche Erinnerung</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {enabled ? <Bell size={18} color="var(--text-primary)" /> : <BellOff size={18} color="var(--text-muted)" />}
            <div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {enabled ? 'Aktiv' : 'Inaktiv'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {enabled ? `Täglich um ${time} Uhr` : 'Keine Erinnerungen'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (!enabled && permission !== 'granted') {
                requestPermission()
              } else {
                setEnabled(e => !e)
              }
            }}
            style={{
              width: 44, height: 26, borderRadius: 13,
              background: enabled ? 'var(--text-primary)' : 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              position: 'relative', cursor: 'pointer',
              transition: 'background 200ms ease',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 3, left: enabled ? 20 : 3,
              width: 18, height: 18,
              borderRadius: '50%',
              background: enabled ? 'var(--text-inverse)' : 'var(--text-muted)',
              transition: 'left 200ms ease',
            }} />
          </button>
        </div>

        {enabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
            <Clock size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Uhrzeit</span>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{
                marginLeft: 'auto',
                padding: '4px 8px',
                fontSize: '0.875rem',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {permission === 'denied' && (
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: 'var(--danger)' }}>
            Browser-Benachrichtigungen wurden blockiert. Bitte in den Browser-Einstellungen erlauben.
          </p>
        )}
        {permission === 'unsupported' && (
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Dein Browser unterstützt keine Push-Benachrichtigungen.
          </p>
        )}
      </div>

      {/* Nudge types */}
      <div style={card}>
        <p style={sectionLabel}>Was dich erinnert</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '📝', title: 'Täglicher Check-in', desc: 'Erinnerung, einen Eintrag zu machen' },
            { icon: '💬', title: 'Reframe-Nudge', desc: 'Hinweis auf negative Einträge ohne Reflexion' },
            { icon: '✨', title: 'Stärken-Erinnerung', desc: 'Zeigt positive Einträge aus der Vergangenheit' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.125rem' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon */}
      <div style={{ ...card, opacity: 0.7 }}>
        <p style={sectionLabel}>Bald verfügbar</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Wöchentliche Zusammenfassung per E-Mail', 'Intelligente Zeitwahl basierend auf deinen Mustern', 'Stille Stunden konfigurieren'].map(f => (
            <div key={f} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ opacity: 0.5 }}>○</span> {f}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
