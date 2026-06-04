'use client'

import { useCallback, useRef } from 'react'

export function useMirrorTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const sched = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }, [])

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  return { sched, clear }
}
