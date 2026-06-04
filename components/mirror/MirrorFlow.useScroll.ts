'use client'

import { useCallback, useEffect, useRef } from 'react'

/** Within this distance from bottom, auto-follow stays active */
const NEAR_BOTTOM_PX = 64
const EXPAND_SCROLL_MS = 680

export function useMirrorScroll(phase: 'loading' | 'mirror') {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)

  useEffect(() => {
    if (phase !== 'mirror') return
    pinnedRef.current = true
    const viewport = scrollRef.current
    if (!viewport) return

    const onScroll = () => {
      const dist = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop
      pinnedRef.current = dist <= NEAR_BOTTOM_PX
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', onScroll)
  }, [phase])

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current
    if (!el) return
    pinnedRef.current = true
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  /** Scroll down only if the user has not scrolled up away from the bottom */
  const scrollIfPinned = useCallback((smooth = true) => {
    if (!pinnedRef.current) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  /** After a block expand animation, catch up once if still pinned */
  const scrollAfterExpand = useCallback(() => {
    scrollIfPinned(true)
    window.setTimeout(() => scrollIfPinned(false), EXPAND_SCROLL_MS)
  }, [scrollIfPinned])

  useEffect(() => {
    if (phase !== 'mirror') return
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [phase])

  return { scrollRef, scrollToBottom, scrollIfPinned, scrollAfterExpand, scrollDown: scrollToBottom }
}
