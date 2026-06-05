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
        <div className="sticky top-[52px] z-30 mb-1 flex justify-end bg-canvas/90 py-1 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={onClose}
            className="nav-interactive nav-interactive--ink flex size-[34px] items-center justify-center rounded-lg border border-edge"
            aria-label="Schließen"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
      ) : null}
      {children}
    </div>
  )
}
