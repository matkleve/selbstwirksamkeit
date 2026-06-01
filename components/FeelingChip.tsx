'use client'

import { useMemo, useRef, useState } from 'react'
import { Heart, Plus, X } from 'lucide-react'
import { FEELINGS, feelingIcon, toFeelingMenuItems } from '@/lib/feelings'
import type { BodyState } from '@/lib/types'
import { DropdownPanel, useClickOutside } from '@/components/DropdownPanel'
import { chipGhost, chipFilled } from '@/lib/chip-classes'

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

  const menuItems = toFeelingMenuItems(filtered, feeling => {
    onSelect(feeling.label, feeling.bodyState)
    setOpen(false)
    setQuery('')
  })

  if (display) {
    const SelectedIcon = feelingIcon(display) ?? Heart
    return (
      <button type="button" onClick={onClear} className={chipFilled}>
        <SelectedIcon size={15} strokeWidth={1.75} className="shrink-0" aria-hidden />
        <span>{display}</span>
        <X size={14} strokeWidth={2} className="ml-0.5 shrink-0 opacity-55" aria-hidden />
      </button>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setQuery('') }}
        className={chipGhost}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Heart size={15} strokeWidth={1.75} className="shrink-0" aria-hidden />
        <span>Zustand</span>
        <Plus size={14} strokeWidth={2} className="ml-0.5 shrink-0 opacity-55" aria-hidden />
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
          renderIcon={item => {
            const feeling = FEELINGS.find(f => f.label === item.label)
            if (!feeling) return null
            const Icon = feeling.icon
            return <Icon size={15} strokeWidth={1.75} className="size-[15px]" aria-hidden />
          }}
        />
      )}
    </div>
  )
}
