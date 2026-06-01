'use client'

import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Plus, X } from 'lucide-react'
import { DropdownPanel, type DropdownMenuItem } from '@/components/DropdownPanel'
import { chipGhost, chipField, chipFilled } from '@/lib/chip-classes'

interface AddChipProps {
  icon: LucideIcon
  label: string
  onClick: () => void
}

export function AddChip({ icon: Icon, label, onClick }: AddChipProps) {
  return (
    <button type="button" onClick={onClick} className={chipGhost}>
      <Icon size={15} strokeWidth={1.75} className="shrink-0" aria-hidden />
      <span>{label}</span>
      <Plus size={14} strokeWidth={2} className="ml-0.5 shrink-0 opacity-55" aria-hidden />
    </button>
  )
}

interface FilledChipProps {
  icon: LucideIcon
  value: string
  onClear: () => void
}

export function FilledChip({ icon: Icon, value, onClear }: FilledChipProps) {
  return (
    <button type="button" onClick={onClear} className={chipFilled}>
      <Icon size={15} strokeWidth={1.75} className="shrink-0" aria-hidden />
      <span>{value}</span>
      <X size={14} strokeWidth={2} className="ml-0.5 shrink-0 opacity-55" aria-hidden />
    </button>
  )
}

interface ChipInputProps {
  value: string
  onChange: (v: string) => void
  onClose: () => void
  placeholder: string
}

export function ChipInput({ value, onChange, onClose, placeholder }: ChipInputProps) {
  return (
    <input
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value.slice(0, 40))}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
      }}
      placeholder={placeholder}
      className={chipField}
    />
  )
}

interface EntityChipEditorProps {
  icon: LucideIcon
  value: string
  onChange: (v: string) => void
  onClose: () => void
  placeholder: string
  suggestions: string[]
}

export function EntityChipEditor({
  icon: Icon,
  value,
  onChange,
  onClose,
  placeholder,
  suggestions,
}: EntityChipEditorProps) {
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase()
    const list = q
      ? suggestions.filter(s => s.toLowerCase().includes(q))
      : suggestions
    return list.slice(0, 10)
  }, [value, suggestions])

  const items: DropdownMenuItem[] = filtered.map(name => ({
    type: 'item',
    id: name,
    label: name,
    icon: Icon,
    onClick: () => {
      onChange(name)
      onClose()
    },
  }))

  return (
    <div className="relative inline-flex">
      <ChipInput
        value={value}
        onChange={onChange}
        onClose={onClose}
        placeholder={placeholder}
      />
      {items.length > 0 && (
        <div onMouseDown={e => e.preventDefault()}>
          <DropdownPanel role="listbox" items={items} minWidth={160} />
        </div>
      )}
    </div>
  )
}
