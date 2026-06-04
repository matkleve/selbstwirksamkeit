'use client'

import { useCallback, useEffect, useRef } from 'react'

const SCROLL_EASE = 0.085

export function useMirrorScroll(phase: 'loading' | 'mirror') {
  const scrollRef = useRef<HTMLDivElement>(null)

  /** Continuous ease toward bottom while mirror is active — tracks growing content. */
  useEffect(() => {
    if (phase !== 'mirror') return
    let running = true

    const tick = () => {
      if (!running) return
      const viewport = scrollRef.current
      if (viewport) {
        const target = viewport.scrollHeight - viewport.clientHeight
        const delta = target - viewport.scrollTop
        if (Math.abs(delta) > 0.5) {
          viewport.scrollTop += delta * SCROLL_EASE
        }
      }
      requestAnimationFrame(tick)
    }

    const id = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(id)
    }
  }, [phase])

  const scrollDown = useCallback((smooth = false) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  return { scrollRef, scrollDown }
}
