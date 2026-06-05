'use client'

import { useRef, useState, type ReactNode } from 'react'
import { DropdownPanel, useClickOutside, type DropdownMenuItem } from '@/components/DropdownPanel'

interface Props {
  items: DropdownMenuItem[]
  align?: 'left' | 'right'
  minWidth?: number
  role?: 'menu' | 'listbox'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: (props: { open: boolean; toggle: () => void }) => ReactNode
}

/** Shared open/close shell — hamburger menu (`MenuDropdown`) is the reference trigger + panel pattern. */
export function NavDropdown({
  items,
  align = 'left',
  minWidth = 190,
  role = 'menu',
  open: controlledOpen,
  onOpenChange,
  children,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const open = controlledOpen ?? internalOpen

  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  useClickOutside(ref, () => setOpen(false), open)

  const toggle = () => setOpen(!open)
  const close = () => setOpen(false)

  const panelItems: DropdownMenuItem[] = items.map(entry => {
    if (entry.type === 'separator' || entry.type === 'header') return entry
    const onClick = entry.onClick
    return { ...entry, onClick: () => { close(); onClick() } }
  })

  return (
    <div ref={ref} className="relative">
      {children({ open, toggle })}
      {open && (
        <DropdownPanel align={align} minWidth={minWidth} role={role} itemTone="nav" items={panelItems} />
      )}
    </div>
  )
}
