'use client'

import { useMemo, useRef, useState } from 'react'
import { Heart, Plus, X } from 'lucide-react'
import { FEELINGS, feelingIcon } from '@/lib/feelings'
import type { BodyState } from '@/lib/types'
import { DropdownPanel, useClickOutside } from '@/components/DropdownPanel'
import type { DropdownMenuItem } from '@/components/DropdownPanel'

const chipBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 20,
  fontSize: '0.8125rem',
  fontFamily: 'inherit',
  border: '1px solid var(--border)',
  background: 'var(--bg-subtle)',
  cursor: 'pointer',
  lineHeight: 1.2,
}

interface Props {
  feelingLabel: string | null
  bodyState: BodyState | null
  onSelect: (label: string, bodyState: BodyState) => void
  onClear: () => void
}

export default function FeelingChip({ feelingLabel, bodyState, onSelect, onClear }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useClickOutside(rootRef, () => setOpen(false), open)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FEELINGS
    return FEELINGS.filter(f => f.label.toLowerCase().includes(q))
  }, [query])

  const display = feelingLabel ?? (bodyState
    ? FEELINGS.find(f => f.bodyState === bodyState)?.label ?? bodyState
    : null)

  const menuItems: DropdownMenuItem[] = filtered.map(f => ({
    type: 'item',
    id: f.label,
    label: f.label,
    icon: f.icon,
    onClick: () => {
      onSelect(f.label, f.bodyState)
      setOpen(false)
      setQuery('')
    },
  }))

  if (display) {
    const SelectedIcon = feelingIcon(display) ?? Heart
    return (
      <button
        type="button"
        onClick={onClear}
        style={{
          ...chipBase,
          background: 'var(--text-primary)',
          color: 'var(--text-inverse)',
          border: 'none',
        }}
      >
        <SelectedIcon size={15} strokeWidth={1.75} aria-hidden />
        <span>{display}</span>
        <X size={14} strokeWidth={2} style={{ opacity: 0.55, marginLeft: 2 }} aria-hidden />
      </button>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setQuery('') }}
        style={{ ...chipBase, color: 'var(--text-secondary)' }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Heart size={15} strokeWidth={1.75} aria-hidden />
        <span>Zustand</span>
        <Plus size={14} strokeWidth={2} style={{ opacity: 0.55, marginLeft: 2 }} aria-hidden />
      </button>

      {open && (
        <DropdownPanel
          role="listbox"
          align="left"
          search={{
            value: query,
            onChange: setQuery,
            placeholder: 'Gefühl suchen…',
          }}
          items={menuItems}
        />
      )}
    </div>
  )
}
