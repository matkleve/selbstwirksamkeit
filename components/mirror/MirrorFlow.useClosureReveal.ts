'use client'

import { useEffect } from 'react'
import { splitRevealWords } from '@/lib/mirrorReveal'

export interface ClosureRevealState {
  line: number
  words: number
}

export function useMirrorClosureReveal(
  active: boolean,
  messages: string[],
  setReveal: (state: ClosureRevealState) => void,
  onComplete: () => void,
) {
  useEffect(() => {
    if (!active || messages.length === 0) {
      setReveal({ line: 0, words: 0 })
      return
    }

    const lines = messages.map(m => splitRevealWords(m))
    const timers: ReturnType<typeof setTimeout>[] = []
    const sched = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms))
    }

    let line = 0
    let word = 0

    const tick = () => {
      const lineWords = lines[line]!
      if (word < lineWords.length) {
        word += 1
        setReveal({ line, words: word })
        sched(tick, 300)
        return
      }
      if (line < lines.length - 1) {
        sched(() => {
          line += 1
          word = 0
          setReveal({ line, words: 0 })
          sched(tick, 320)
        }, 520)
        return
      }
      sched(onComplete, 360)
    }

    setReveal({ line: 0, words: 0 })
    sched(tick, 420)
    return () => timers.forEach(clearTimeout)
  }, [active, messages, setReveal, onComplete])
}
