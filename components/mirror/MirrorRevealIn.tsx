'use client'

import { cn } from '@/lib/cn'
import type { CSSProperties, ReactNode } from 'react'

export function MirrorRevealIn({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode
  className?: string
  /** Stagger delay before slide-in starts */
  delayMs?: number
}) {
  const style: CSSProperties | undefined = delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined

  return (
    <div className={cn('mirror-reveal-in', className)} style={style}>
      {children}
    </div>
  )
}
