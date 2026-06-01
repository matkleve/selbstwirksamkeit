'use client'

import { useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Search } from 'lucide-react'

export type DropdownMenuItem =
  | { type: 'item'; id: string; label: string; icon?: LucideIcon; onClick: () => void; destructive?: boolean }
  | { type: 'separator' }

interface SearchConfig {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

interface Props {
  items: DropdownMenuItem[]
  search?: SearchConfig
  emptyMessage?: string
  align?: 'left' | 'right'
  minWidth?: number
  role?: 'menu' | 'listbox'
}

export function DropdownPanel({
  items,
  search,
  emptyMessage = 'Kein Treffer',
  align = 'left',
  minWidth = 220,
  role = 'menu',
}: Props) {
  const optionItems = items.filter((i): i is Extract<DropdownMenuItem, { type: 'item' }> => i.type === 'item')
  const showEmpty = search && optionItems.length === 0

  return (
    <div
      role={role}
      className={[
        'absolute top-[calc(100%+6px)] z-50 overflow-hidden',
        'rounded-xl border border-edge bg-card shadow-[var(--shadow-card)]',
        align === 'right' ? 'right-0' : 'left-0',
      ].join(' ')}
      style={{ minWidth, maxWidth: 280 }}
    >
      {search && (
        <div className="flex items-center gap-2 border-b border-edge px-2.5 py-2">
          <Search size={15} className="shrink-0 text-ink-3" aria-hidden />
          <input
            autoFocus
            value={search.value}
            onChange={e => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
          />
        </div>
      )}

      <ul className="m-0 max-h-[200px] list-none overflow-y-auto p-1">
        {showEmpty ? (
          <li className="px-3 py-2.5 text-sm text-ink-3">{emptyMessage}</li>
        ) : (
          items.map((entry, i) => {
            if (entry.type === 'separator') {
              return <li key={`sep-${i}`} className="my-1 h-px bg-edge" role="separator" />
            }
            const Icon = entry.icon
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  role={role === 'listbox' ? 'option' : 'menuitem'}
                  onClick={entry.onClick}
                  className={[
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm',
                    'font-[inherit] transition-colors hover:bg-subtle active:bg-subtle',
                    entry.destructive ? 'text-danger' : 'text-ink',
                  ].join(' ')}
                >
                  {Icon ? (
                    <span className="inline-flex w-[15px] shrink-0 items-center justify-center text-ink-2">
                      <Icon size={15} strokeWidth={1.75} aria-hidden />
                    </span>
                  ) : null}
                  <span>{entry.label}</span>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [ref, onClose, enabled])
}
