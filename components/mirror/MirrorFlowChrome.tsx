'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function MirrorFlowChrome({
  onClose,
  children,
}: {
  onClose?: () => void
  children: ReactNode
}) {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="nav-interactive nav-interactive--ink absolute right-0 top-0 z-30 flex size-[34px] items-center justify-center rounded-full border border-edge bg-canvas"
          aria-label="Schließen"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      ) : null}
      {children}
    </div>
  )
}
