'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { ConfirmPillButton } from '@/components/PillButton'

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
        <ConfirmPillButton
          icon={<X size={18} strokeWidth={1.75} aria-hidden />}
          confirmLabel="Abbrechen"
          onConfirm={onClose}
          align="right"
          className="absolute right-0 top-0 z-30"
        />
      ) : null}
      {children}
    </div>
  )
}
