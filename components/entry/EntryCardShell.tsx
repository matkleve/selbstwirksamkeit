'use client'

import { cn } from '@/lib/cn'
import { GridTintBackground } from '@/components/GridTintBackground'
import { entryCardBackground, entryCardBorderColor } from '@/lib/entryCardTint'
import type { Entry } from '@/lib/types'
import type { ReactNode } from 'react'

interface Props {
  entry: Entry
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md'
}

export function EntryCardShell({ entry, children, className, padding = 'sm' }: Props) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border shadow-card',
        padding === 'sm' ? 'px-3.5 pb-3 pt-2' : 'px-4 pb-4 pt-2.5 md:px-[18px] md:pb-[18px] md:pt-3',
        className,
      )}
      style={{
        background: entryCardBackground(entry, padding === 'sm'),
        borderColor: entryCardBorderColor(entry, padding === 'sm'),
      }}
    >
      <GridTintBackground
        x={entry.grid_x}
        y={entry.grid_y}
        preset={padding === 'sm' ? 'card-compact' : 'card'}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}
