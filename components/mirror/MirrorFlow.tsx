'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { MirrorCandidate } from '@/lib/patternDetection'
import { splitRevealWords } from '@/lib/mirrorReveal'
import { buildNarrativeBlocks } from '@/components/mirror/MirrorFlow.blocks'
import type { BlockState } from '@/components/mirror/MirrorFlow.types'
import { useMirrorScroll } from '@/components/mirror/MirrorFlow.useScroll'
import { useMirrorTimers } from '@/components/mirror/MirrorFlow.useTimers'
import { useMirrorLoadingPhase, useMirrorSession } from '@/components/mirror/MirrorFlow.useLoading'
import { useMirrorNarrativeSchedule } from '@/components/mirror/MirrorFlow.useNarrativeSchedule'
import {
  useMirrorSummaryReveal,
} from '@/components/mirror/MirrorFlow.useSummary'
import { MirrorFlowLoading } from '@/components/mirror/MirrorFlow.loading'
import { MirrorFlowChat } from '@/components/mirror/MirrorFlow.chat'
import { MirrorExpandShell } from '@/components/mirror/MirrorExpandShell'
import { MirrorNarrativeBlock } from '@/components/mirror/MirrorFlow.narrativeBlock'
import {
  MirrorReflectionSection,
  MirrorIntentionSection,
  MirrorSummarySection,
} from '@/components/mirror/MirrorFlow.response'

export default function MirrorFlow({ candidate }: { candidate: MirrorCandidate | null }) {
  const blocks = useMemo(() => buildNarrativeBlocks(candidate), [candidate])
  const [loadingStep, setLoadingStep] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'mirror'>('loading')
  const [states, setStates] = useState<Record<string, BlockState>>({})
  const [narrativeDone, setNarrativeDone] = useState(false)
  const [reflectionText, setReflectionText] = useState('')
  const [pastReflection, setPastReflection] = useState(false)
  const [wennText, setWennText] = useState('')
  const [dannText, setDannText] = useState('')
  const [duration, setDuration] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryWords, setSummaryWords] = useState(0)

  const sessionIdRef = useRef<string | null>(null)
  const supabase = createClient()
  const { sched, clear } = useMirrorTimers()
  const { scrollRef, scrollDown } = useMirrorScroll(phase)

  useMirrorLoadingPhase(
    blocks,
    sched,
    clear,
    setLoadingStep,
    setStates,
    setNarrativeDone,
    setPastReflection,
    setShowSummary,
    setSummaryWords,
    setPhase,
  )
  useMirrorSession(phase, candidate, sessionIdRef, supabase)
  useMirrorNarrativeSchedule(phase, blocks, candidate, sched, clear, setStates, setNarrativeDone)
  useMirrorSummaryReveal(showSummary, setSummaryWords)

  const blockWords = (text: string) => splitRevealWords(text)
  const wordProgress = (id: string, text: string) => states[id]?.wordCount ?? 0
  const isWordTyping = (id: string, text: string) =>
    wordProgress(id, text) < blockWords(text).length

  const continuePastReflection = useCallback(async () => {
    const response = reflectionText.trim() || null
    if (sessionIdRef.current) {
      await supabase
        .from('mirror_sessions')
        .update({ user_response: response })
        .eq('id', sessionIdRef.current)
    }
    setPastReflection(true)
    scrollDown(true)
  }, [reflectionText, supabase, scrollDown])

  const handleIntentionContinue = async () => {
    const wenn = wennText.trim()
    const dann = dannText.trim()
    if (wenn && dann) {
      const reminderMap: Record<string, string> = {
        Heute: 'today',
        '3 Tage': '3days',
        'Diese Woche': '7days',
      }
      await supabase.from('implementation_intentions').insert({
        wenn_text: wenn,
        dann_text: dann,
        wants_reminder: !!duration && duration !== 'Kein Reminder',
        reminder_type: duration ? (reminderMap[duration] ?? null) : null,
        active: true,
      })
    }
    setShowSummary(true)
    scrollDown(true)
  }

  const intentionComplete = Boolean(wennText.trim() && dannText.trim())
  const emptyState = !candidate

  return (
    <>
      {phase === 'loading' && <MirrorFlowLoading loadingStep={loadingStep} />}

      {phase === 'mirror' && (
        <MirrorFlowChat scrollRef={scrollRef}>
          {blocks.map((block, idx) => (
            <MirrorExpandShell key={block.id} open={!!states[block.id]?.visible}>
              <MirrorNarrativeBlock
                block={block}
                idx={idx}
                states={states}
                candidate={candidate}
                blockWords={blockWords}
                wordProgress={wordProgress}
                isWordTyping={isWordTyping}
              />
            </MirrorExpandShell>
          ))}

          {!emptyState && (
            <>
              <MirrorExpandShell open={narrativeDone}>
                <MirrorReflectionSection
                  blocksLength={blocks.length}
                  reflectionText={reflectionText}
                  setReflectionText={setReflectionText}
                  sessionIdRef={sessionIdRef}
                  supabase={supabase}
                  onContinue={() => void continuePastReflection()}
                />
              </MirrorExpandShell>

              <MirrorExpandShell open={pastReflection}>
                <MirrorIntentionSection
                  blocksLength={blocks.length}
                  wennText={wennText}
                  setWennText={setWennText}
                  dannText={dannText}
                  setDannText={setDannText}
                  intentionComplete={intentionComplete}
                  duration={duration}
                  setDuration={setDuration}
                  onContinue={() => void handleIntentionContinue()}
                />
              </MirrorExpandShell>
            </>
          )}

          <MirrorExpandShell open={showSummary}>
            <MirrorSummarySection blocksLength={blocks.length} summaryWords={summaryWords} />
          </MirrorExpandShell>
        </MirrorFlowChat>
      )}
    </>
  )
}
