'use client'

import { cn } from '@/lib/cn'
import { cardBoxShadow, ENTRY_CARD_DROP_SHADOW } from '@/lib/gridZones'
import type { Entry } from '@/lib/types'
import type { ReactNode } from 'react'

interface Props {
  entry: Entry
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md'
}

/** Saved entry card — same bilinear tint as compose (`cardBoxShadow`). */
export function EntryCardShell({ entry, children, className, padding = 'sm' }: Props) {
  const boxShadow =
    entry.grid_x !== null
      ? cardBoxShadow(entry.grid_x, entry.grid_y ?? 0)
      : ENTRY_CARD_DROP_SHADOW

  return (
    <div
      className={cn(
        'w-full min-w-0 rounded-card bg-card transition-[box-shadow] duration-300 ease-out',
        padding === 'sm' ? 'px-3.5 pb-3 pt-2' : 'px-4 pb-4 pt-2.5 md:px-[18px] md:pb-[18px] md:pt-3',
        className,
      )}
      style={{ boxShadow }}
    >
      {children}
    </div>
  )
}
