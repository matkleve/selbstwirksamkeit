'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Sparkles, TrendingUp, Wrench } from 'lucide-react'
import { CHANGELOG, APP_VERSION } from '@/lib/changelog'
import type { ChangelogEntry } from '@/lib/changelog'

interface Props {
  onClose: () => void
}

const KIND_CONFIG = {
  new: { label: 'Neu', icon: Sparkles, color: 'text-accent' },
  improved: { label: 'Verbessert', icon: TrendingUp, color: 'text-ink-2' },
  fixed: { label: 'Behoben', icon: Wrench, color: 'text-ink-3' },
} as const

function VersionBlock({ entry, current }: { entry: ChangelogEntry; current: boolean }) {
  return (
    <div className="border-b border-edge pb-5 last:border-0 last:pb-0">
      <div className="mb-3 flex items-baseline gap-2.5">
        <span className="text-base font-semibold text-ink">v{entry.version}</span>
        {current && (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-0.5 text-[0.6875rem] font-medium text-accent">
            aktuell
          </span>
        )}
        <span className="ml-auto text-xs text-ink-3">{entry.date}</span>
      </div>
      <p className="mb-2.5 text-sm font-medium text-ink-2">{entry.title}</p>
      <ul className="space-y-1.5">
        {entry.changes.map((change, i) => {
          const cfg = KIND_CONFIG[change.kind]
          return (
            <li key={i} className="flex items-start gap-2">
              <cfg.icon
                size={13}
                strokeWidth={1.75}
                className={`mt-[3px] shrink-0 ${cfg.color}`}
                aria-hidden
              />
              <span className="text-sm leading-snug text-ink-2">{change.text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ChangelogPanel({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Versionsverlauf"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-card shadow-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-edge px-4 py-3.5">
          <div>
            <span className="text-sm font-semibold text-ink">Selbstwirksamkeit</span>
            <span className="ml-2 text-xs text-ink-3">v{APP_VERSION}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-subtle hover:text-ink"
            aria-label="Schließen"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-4 py-4 sm:max-h-[60vh]">
          {CHANGELOG.map((entry, i) => (
            <VersionBlock key={entry.version} entry={entry} current={i === 0} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
