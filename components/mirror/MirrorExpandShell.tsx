'use client'

import { cn } from '@/lib/cn'
import { useEffect, useState, type ReactNode } from 'react'

/** Smooth height reveal — content mounts collapsed, then eases open on the next frame. */
export function MirrorExpandShell({
  open,
  children,
  className,
}: {
  open: boolean
  children: ReactNode
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!open) {
      setExpanded(false)
      return
    }
    const id = requestAnimationFrame(() => setExpanded(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  return (
    <div className={cn('mirror-expand', expanded && 'mirror-expand--open', className)}>
      <div className="mirror-expand-inner">{open ? children : null}</div>
    </div>
  )
}
