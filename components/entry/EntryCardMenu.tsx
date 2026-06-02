'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { DropdownPanel } from '@/components/DropdownPanel'
import { EntryEditOverlay } from '@/components/entry/EntryEditOverlay'
import { useEntries } from '@/components/EntriesProvider'
import { createClient } from '@/lib/supabase'
import type { Entry } from '@/lib/types'

interface Props {
  entry: Entry
}

const MENU_GAP = 6

export function EntryCardMenu({ entry }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { refresh } = useEntries()
  const supabase = createClient()

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + MENU_GAP,
      left: rect.right,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const handleDelete = async () => {
    setOpen(false)
    if (!window.confirm('Eintrag wirklich löschen?')) return
    await supabase.from('entries').delete().eq('id', entry.id)
    await refresh()
  }

  const menuItems = [
    {
      type: 'item' as const,
      id: 'edit',
      label: 'Bearbeiten',
      icon: Pencil,
      onClick: () => {
        setOpen(false)
        setEditing(true)
      },
    },
    { type: 'separator' as const },
    {
      type: 'item' as const,
      id: 'delete',
      label: 'Löschen',
      icon: Trash2,
      destructive: true,
      onClick: handleDelete,
    },
  ]

  return (
    <>
      <div ref={anchorRef} className="relative -mr-1 shrink-0">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false)
              return
            }
            updatePosition()
            setOpen(true)
          }}
          className={[
            'flex size-7 cursor-pointer items-center justify-center rounded-md text-ink-3',
            'transition-colors hover:bg-subtle hover:text-ink-2',
            open ? 'bg-subtle text-ink-2' : '',
          ].join(' ')}
          aria-label="Eintrag-Menü"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <MoreVertical size={16} strokeWidth={1.75} />
        </button>
      </div>

      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200]"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              transform: 'translateX(-100%)',
            }}
          >
            <DropdownPanel align="right" minWidth={160} anchored={false} items={menuItems} />
          </div>,
          document.body,
        )}

      {editing && (
        <EntryEditOverlay entry={entry} onClose={() => setEditing(false)} />
      )}
    </>
  )
}
