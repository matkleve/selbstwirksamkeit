'use client'

import { useCallback, useEffect, useRef } from 'react'

const SCROLL_EASE = 0.085
/** Within this distance from bottom, auto-follow stays active */
const NEAR_BOTTOM_PX = 64

export function useMirrorScroll(phase: 'loading' | 'mirror') {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)
  const animatingRef = useRef(false)

  const followTowardBottom = useCallback(() => {
    if (!pinnedRef.current || animatingRef.current) return
    animatingRef.current = true

    const tick = () => {
      const viewport = scrollRef.current
      if (!viewport || !pinnedRef.current) {
        animatingRef.current = false
        return
      }
      const target = viewport.scrollHeight - viewport.clientHeight
      const delta = target - viewport.scrollTop
      if (Math.abs(delta) < 0.5) {
        viewport.scrollTop = target
        animatingRef.current = false
        return
      }
      viewport.scrollTop += delta * SCROLL_EASE
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [])

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

  useEffect(() => {
    if (phase !== 'mirror') return
    const viewport = scrollRef.current
    const messages = viewport?.querySelector('.mirror-chat-messages')
    if (!viewport || !messages) return

    const ro = new ResizeObserver(() => followTowardBottom())
    ro.observe(messages)
    return () => ro.disconnect()
  }, [phase, followTowardBottom])

  const scrollDown = useCallback((smooth = false) => {
    const el = scrollRef.current
    if (!el) return
    pinnedRef.current = true
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  return { scrollRef, scrollDown }
}
