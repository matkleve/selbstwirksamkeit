'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { chipGhost } from '@/lib/chip-classes'

interface Props {
  icon: LucideIcon
  label: string
  count: number
  items: string[]
  size?: 'sm' | 'md'
}

export function EntryMetaPopover({ icon: Icon, label, count, items, size = 'sm' }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (count === 0) return null

  const chipH = size === 'sm' ? 'h-6 min-h-6 max-h-6 px-2 text-xs' : ''

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${count}`}
        onClick={() => setOpen(v => !v)}
        className={cn(chipGhost, chipH, 'gap-1')}
      >
        <Icon size={size === 'sm' ? 13 : 15} strokeWidth={1.75} aria-hidden />
        <span>{count}</span>
      </button>

      {open && (
        <div
          id={listId}
          role="dialog"
          className={cn(
            'absolute bottom-[calc(100%+6px)] left-0 z-50 min-w-[140px]',
            'rounded-xl border border-edge bg-card p-2 shadow-[var(--shadow-pop)]',
          )}
        >
          <p className="mb-1.5 px-2 text-[0.625rem] font-medium uppercase tracking-wide text-ink-3">
            {label}
          </p>
          <ul className="m-0 list-none p-0">
            {items.map((item, i) => (
              <li
                key={`${item}-${i}`}
                className="rounded-lg px-2 py-1.5 text-sm text-ink-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
