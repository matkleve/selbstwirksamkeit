'use client'

import type { RefObject, ReactNode } from 'react'

export function MirrorFlowChat({
  scrollRef,
  children,
}: {
  scrollRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  return (
    <div ref={scrollRef} className="mirror-chat-viewport">
      <div className="mirror-chat-stack pt-1 pb-2">
        <div className="mirror-chat-spacer" aria-hidden />
        <div className="mirror-chat-messages">
          <div
            className="pointer-events-none absolute top-0 bottom-0 left-5 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-edge to-transparent"
            aria-hidden
          />
          {children}
        </div>
      </div>
    </div>
  )
}
