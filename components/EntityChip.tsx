'use client'

import type { LucideIcon } from 'lucide-react'
import { Plus, X } from 'lucide-react'

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

interface AddChipProps {
  icon: LucideIcon
  label: string
  onClick: () => void
}

export function AddChip({ icon: Icon, label, onClick }: AddChipProps) {
  return (
    <button type="button" onClick={onClick} style={{ ...chipBase, color: 'var(--text-secondary)' }}>
      <Icon size={15} strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
      <Plus size={14} strokeWidth={2} style={{ opacity: 0.55, marginLeft: 2 }} aria-hidden />
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
      <Icon size={15} strokeWidth={1.75} aria-hidden />
      <span>{value}</span>
      <X size={14} strokeWidth={2} style={{ opacity: 0.55, marginLeft: 2 }} aria-hidden />
    </button>
  )
}

interface ChipInputProps {
  value: string
  onChange: (v: string) => void
  onClose: () => void
  placeholder: string
  listId: string
}

export function ChipInput({ value, onChange, onClose, placeholder, listId }: ChipInputProps) {
  return (
    <input
      autoFocus
      list={listId}
      value={value}
      onChange={e => onChange(e.target.value.slice(0, 40))}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
      }}
      placeholder={placeholder}
      style={{
        ...chipBase,
        width: 160,
        cursor: 'text',
        color: 'var(--text-primary)',
        outline: 'none',
        borderColor: 'var(--border-focus)',
      }}
    />
  )
}
