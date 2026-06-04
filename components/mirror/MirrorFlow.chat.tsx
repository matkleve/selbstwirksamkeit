'use client'

import { MirrorTitle } from '@/components/mirror/MirrorTitle'
import type { RefObject, ReactNode } from 'react'

export function MirrorFlowChat({
  scrollRef,
  showTitle = false,
  children,
}: {
  scrollRef: RefObject<HTMLDivElement | null>
  showTitle?: boolean
  children: ReactNode
}) {
  return (
    <div ref={scrollRef} className="mirror-chat-viewport mx-auto w-full max-w-lg">
      <div className="mirror-chat-stack pt-1 pb-2">
        <div className="mirror-chat-spacer" aria-hidden />
        <div className="mirror-chat-messages">
          {showTitle ? <MirrorTitle className="mb-6" /> : null}
          <div className="relative">
            <div
              className="pointer-events-none absolute top-0 bottom-0 left-5 w-px -translate-x-1/2 bg-gradient-to-b from-edge/40 via-edge/70 to-transparent"
              aria-hidden
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
