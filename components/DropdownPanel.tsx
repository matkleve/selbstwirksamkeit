'use client'

import { createElement, useEffect, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, Search } from 'lucide-react'

export type DropdownMenuItem =
  | {
      type: 'item'
      id: string
      label: string
      icon?: LucideIcon
      onClick: () => void
      destructive?: boolean
      selected?: boolean
    }
  | { type: 'separator' }
  | { type: 'header'; id: string; label: string }

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
  itemTone?: 'default' | 'nav'
  /** When false, parent handles position (e.g. fixed portal) */
  anchored?: boolean
  /** Max height of the scrollable list in px (default 200) */
  listMaxHeight?: number
  /** Prefer over `item.icon` when Lucide refs must render in the parent module */
  renderIcon?: (item: Extract<DropdownMenuItem, { type: 'item' }>) => ReactNode
}

export function DropdownPanel({
  items,
  search,
  emptyMessage = 'Kein Treffer',
  align = 'left',
  minWidth = 220,
  role = 'menu',
  itemTone = 'default',
  renderIcon,
  anchored = true,
  listMaxHeight = 200,
}: Props) {
  const optionItems = items.filter((i): i is Extract<DropdownMenuItem, { type: 'item' }> => i.type === 'item')
  const showEmpty = search && optionItems.length === 0

  return (
    <div
      role={role}
      className={[
        'z-50 overflow-hidden rounded-xl border border-edge bg-card shadow-card',
        anchored && 'absolute top-[calc(100%+6px)]',
        anchored && (align === 'right' ? 'right-0' : 'left-0'),
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
            className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-3"
          />
        </div>
      )}

      <ul className="m-0 list-none overflow-y-auto p-1" style={{ maxHeight: listMaxHeight }}>
        {showEmpty ? (
          <li className="px-3 py-2.5 text-sm text-ink-3">{emptyMessage}</li>
        ) : (
          items.map((entry, i) => {
            if (entry.type === 'separator') {
              return <li key={`sep-${i}`} className="my-1 h-px bg-edge" role="separator" />
            }
            if (entry.type === 'header') {
              return (
                <li key={entry.id} className="px-3 pb-0.5 pt-2 first:pt-1">
                  <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-ink-3">
                    {entry.label}
                  </span>
                </li>
              )
            }
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  role={role === 'listbox' ? 'option' : 'menuitem'}
                  aria-selected={entry.selected}
                  data-active={entry.selected ? '' : undefined}
                  onClick={entry.onClick}
                  className={[
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-[inherit]',
                    itemTone === 'nav'
                      ? [
                          'nav-interactive nav-interactive--ink',
                          entry.destructive && 'nav-interactive--destructive',
                        ].filter(Boolean).join(' ')
                      : [
                          'transition-colors hover:bg-subtle active:bg-subtle',
                          entry.selected && 'bg-subtle font-medium',
                          entry.destructive ? 'text-danger' : 'text-ink',
                        ].join(' '),
                  ].join(' ')}
                >
                  {(() => {
                    const iconNode = renderIcon?.(entry) ?? (entry.selected && !entry.icon
                      ? createElement(Check, {
                          size: 15,
                          strokeWidth: 2,
                          'aria-hidden': true,
                          className: 'size-[15px] shrink-0',
                        })
                      : entry.icon
                        ? createElement(entry.icon, {
                            size: 15,
                            strokeWidth: 1.75,
                            'aria-hidden': true,
                            className: 'size-[15px] shrink-0',
                          })
                        : null)
                    return iconNode ? (
                      <span className="inline-flex size-[15px] shrink-0 items-center justify-center">
                        {iconNode}
                      </span>
                    ) : (
                      <span className="size-[15px] shrink-0" aria-hidden />
                    )
                  })()}
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
