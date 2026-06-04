'use client'

import { useEffect } from 'react'
import { MIRROR_SUMMARY_TEXT } from '@/components/mirror/MirrorFlow.constants'
import { splitRevealWords, scheduleWordTicks } from '@/lib/mirrorReveal'

export function useMirrorSummaryReveal(
  showSummary: boolean,
  setSummaryWords: (n: number) => void,
) {
  useEffect(() => {
    if (!showSummary) {
      setSummaryWords(0)
      return
    }
    const summaryTimers: ReturnType<typeof setTimeout>[] = []
    const schedSummary = (fn: () => void, ms: number) => {
      summaryTimers.push(setTimeout(fn, ms))
    }
    const words = splitRevealWords(MIRROR_SUMMARY_TEXT)
    scheduleWordTicks(words.length, 300, n => setSummaryWords(n), schedSummary)
    return () => summaryTimers.forEach(clearTimeout)
  }, [showSummary, setSummaryWords])
}
