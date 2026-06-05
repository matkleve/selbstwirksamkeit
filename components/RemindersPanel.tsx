'use client'

import { useState } from 'react'
import { Bell, BellOff, Clock, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { isPushSupported, registerPushSubscription } from '@/lib/push/subscribe-client'

interface Props {
  onClose: () => void
}

export function RemindersPanel({ onClose }: Props) {
  const [enabled, setEnabled] = useState(false)
  const [time, setTime] = useState('20:00')
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')

  const requestPermission = async () => {
    if (!isPushSupported()) {
      setPermission('unsupported')
      return
    }
    const result = await registerPushSubscription()
    if (result === 'granted') {
      setPermission('granted')
      setEnabled(true)
      return
    }
    if (result === 'denied') {
      setPermission('denied')
      return
    }
    setPermission(Notification.permission)
  }

  return (
    <div className="flex max-h-[min(85dvh,640px)] flex-col overflow-hidden rounded-card border border-edge bg-card shadow-pop">
      <div className="flex items-center justify-between border-b border-edge px-5 py-4">
        <h2>Erinnerungen</h2>
        <button
          type="button"
          onClick={onClose}
          className="nav-interactive nav-interactive--ink flex size-[34px] items-center justify-center rounded-lg border border-edge"
          aria-label="Schließen"
        >
          <X size={17} strokeWidth={1.75} />
        </button>
      </div>

      <div className="overflow-y-auto p-5">
        <Card className="mb-3.5 p-5">
          <p className="section-label">Tägliche Erinnerung</p>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {enabled ? (
                <Bell size={18} className="shrink-0 text-ink" aria-hidden />
              ) : (
                <BellOff size={18} className="shrink-0 text-ink-3" aria-hidden />
              )}
              <div>
                <p className="text-[0.9375rem] font-medium text-ink">
                  {enabled ? 'Aktiv' : 'Inaktiv'}
                </p>
                <p className="text-xs text-ink-3">
                  {enabled ? `Täglich um ${time} Uhr` : 'Keine Erinnerungen'}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-pressed={enabled}
              onClick={() => {
                if (!enabled && permission !== 'granted') void requestPermission()
                else setEnabled(e => !e)
              }}
              className={cn(
                'relative h-[26px] w-11 shrink-0 rounded-full border border-edge transition-colors',
                enabled ? 'bg-ink' : 'bg-subtle',
              )}
            >
              <span
                className={cn(
                  'absolute top-[3px] size-[18px] rounded-full transition-[left,background-color]',
                  enabled ? 'left-5 bg-ink-inv' : 'left-[3px] bg-ink-3',
                )}
              />
            </button>
          </div>

          {enabled && (
            <div className="flex items-center gap-2.5 rounded-lg bg-subtle px-3.5 py-2.5">
              <Clock size={15} className="shrink-0 text-ink-3" aria-hidden />
              <span className="text-sm text-ink-2">Uhrzeit</span>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="ml-auto rounded-md border border-edge bg-card px-2 py-1 text-sm text-ink"
              />
            </div>
          )}

          {permission === 'denied' && (
            <p className="mt-3 text-[0.8125rem] text-danger">
              Browser-Benachrichtigungen wurden blockiert. Bitte in den Browser-Einstellungen erlauben.
            </p>
          )}
          {permission === 'unsupported' && (
            <p className="mt-3 text-[0.8125rem] text-ink-3">
              Dein Browser unterstützt keine Push-Benachrichtigungen.
            </p>
          )}
        </Card>

        <Card className="mb-3.5 p-5">
          <p className="section-label">Was dich erinnert</p>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {[
              { icon: '📝', title: 'Täglicher Check-in', desc: 'Erinnerung, einen Eintrag zu machen' },
              { icon: '💬', title: 'Reframe-Nudge', desc: 'Hinweis auf negative Einträge ohne Reflexion' },
              { icon: '✨', title: 'Stärken-Erinnerung', desc: 'Zeigt positive Einträge aus der Vergangenheit' },
            ].map(({ icon, title, desc }) => (
              <li key={title} className="flex items-center gap-3">
                <span className="text-lg" aria-hidden>{icon}</span>
                <div>
                  <p className="text-sm font-medium text-ink">{title}</p>
                  <p className="text-xs text-ink-3">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 opacity-70">
          <p className="section-label">Bald verfügbar</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-ink-3">
            {[
              'Wöchentliche Zusammenfassung per E-Mail',
              'Intelligente Zeitwahl basierend auf deinen Mustern',
              'Stille Stunden konfigurieren',
            ].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span aria-hidden>○</span>
                {f}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
