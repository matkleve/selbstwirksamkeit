'use client'

import { cn } from '@/lib/cn'
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
        'rounded-card border shadow-card',
        padding === 'sm' ? 'px-3.5 pb-3 pt-2' : 'px-4 pb-4 pt-2.5 md:px-[18px] md:pb-[18px] md:pt-3',
        className,
      )}
      style={{
        background: entryCardBackground(entry),
        borderColor: entryCardBorderColor(entry),
      }}
    >
      {children}
    </div>
  )
}
