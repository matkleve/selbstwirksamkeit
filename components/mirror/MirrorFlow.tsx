'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import type { Entry } from '@/lib/types'
import { useEntries } from '@/components/EntriesProvider'
import {
  entriesForMirrorExploration,
  getMirrorExplorationOffers,
  pickMirrorExplorationIntro,
  type MirrorExplorationBlock,
  type MirrorExplorationKind,
} from '@/lib/mirrorExploration'
import { createClient } from '@/lib/supabase'
import type { MirrorCandidate } from '@/lib/patternDetection'
import { splitRevealWords } from '@/lib/mirrorReveal'
import { buildNarrativeBlocks } from '@/components/mirror/MirrorFlow.blocks'
import type { BlockState } from '@/components/mirror/MirrorFlow.types'
import { useMirrorScroll } from '@/components/mirror/MirrorFlow.useScroll'
import { useMirrorBlockAutoScroll } from '@/components/mirror/MirrorFlow.useBlockAutoScroll'
import { useMirrorTimers } from '@/components/mirror/MirrorFlow.useTimers'
import { useMirrorLoadingPhase, useMirrorSession, initBlockStates } from '@/components/mirror/MirrorFlow.useLoading'
import { useMirrorNarrativeSchedule } from '@/components/mirror/MirrorFlow.useNarrativeSchedule'
import {
  buildMirrorClosureMessages,
  type MirrorClosureMode,
} from '@/components/mirror/MirrorFlow.constants'
import {
  useMirrorClosureReveal,
  type ClosureRevealState,
} from '@/components/mirror/MirrorFlow.useClosureReveal'
import {
  useMirrorExplorationReveal,
  type ExplorationBlockReveal,
} from '@/components/mirror/MirrorFlow.useExplorationReveal'
import { MirrorFlowLoading } from '@/components/mirror/MirrorFlow.loading'
import { MirrorFlowChat } from '@/components/mirror/MirrorFlow.chat'
import { MirrorExpandShell } from '@/components/mirror/MirrorExpandShell'
import { MirrorNarrativeBlock } from '@/components/mirror/MirrorFlow.narrativeBlock'
import {
  MirrorReflectionSection,
  MirrorIntentionSection,
  MirrorClosureSection,
} from '@/components/mirror/MirrorFlow.response'
import { MirrorEmptyClose } from '@/components/mirror/MirrorFlow.emptyClose'
import { MirrorFlowChrome } from '@/components/mirror/MirrorFlowChrome'
import { reminderTypeForLabel } from '@/components/mirror/MirrorFlow.constants'
import { registerPushSubscription } from '@/lib/push/subscribe-client'
import { intentionExpiresAt } from '@/lib/intentionReminderText'

interface MirrorFlowProps {
  candidate: MirrorCandidate | null
  skipInitialLoader?: boolean
  onClose?: () => void
}

export default function MirrorFlow({
  candidate,
  skipInitialLoader = false,
  onClose,
}: MirrorFlowProps) {
  const blocks = useMemo(() => buildNarrativeBlocks(candidate), [candidate])
  const [loadingStep, setLoadingStep] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'mirror'>(skipInitialLoader ? 'mirror' : 'loading')
  const [states, setStates] = useState<Record<string, BlockState>>(() =>
    skipInitialLoader ? initBlockStates(blocks) : {},
  )
  const [narrativeDone, setNarrativeDone] = useState(false)
  const [reflectionText, setReflectionText] = useState('')
  const [pastReflection, setPastReflection] = useState(false)
  const [wennText, setWennText] = useState('')
  const [dannText, setDannText] = useState('')
  const [duration, setDuration] = useState<string | null>(null)
  const [showReminderStep, setShowReminderStep] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [closureMode, setClosureMode] = useState<MirrorClosureMode>('session_only')
  const [closureReveal, setClosureReveal] = useState<ClosureRevealState>({ line: 0, words: 0 })
  const [closureComplete, setClosureComplete] = useState(false)
  const [usedExplorationKinds, setUsedExplorationKinds] = useState<
    Set<MirrorExplorationKind>
  >(() => new Set())
  const [explorationBlocks, setExplorationBlocks] = useState<MirrorExplorationBlock[]>([])
  const [explorationReveal, setExplorationReveal] = useState<
    Record<string, ExplorationBlockReveal>
  >({})

  const { entries: allEntries } = useEntries()
  const closureMessages = useMemo(
    () => buildMirrorClosureMessages(closureMode),
    [closureMode],
  )

  const explorationOffers = useMemo(
    () =>
      candidate
        ? getMirrorExplorationOffers(candidate, allEntries)
        : { more: false, positive: false, contrast: false },
    [candidate, allEntries],
  )

  const sessionIdRef = useRef<string | null>(null)
  const supabase = createClient()
  const { sched, clear } = useMirrorTimers()
  const { scrollRef, scrollDown, scrollAfterExpand } = useMirrorScroll(phase)

  const resetClosure = useCallback(() => {
    setClosureComplete(false)
    setClosureReveal({ line: 0, words: 0 })
  }, [])

  useMirrorBlockAutoScroll(
    phase,
    blocks,
    states,
    narrativeDone,
    pastReflection,
    showReminderStep,
    showSummary,
    scrollAfterExpand,
  )

  useMirrorLoadingPhase(
    blocks,
    sched,
    clear,
    setLoadingStep,
    setStates,
    setNarrativeDone,
    setPastReflection,
    setShowSummary,
    resetClosure,
    setPhase,
    !skipInitialLoader,
  )
  useMirrorSession(phase, candidate, sessionIdRef, supabase)
  useMirrorNarrativeSchedule(phase, blocks, candidate, sched, clear, setStates, setNarrativeDone)
  useMirrorExplorationReveal(
    explorationBlocks,
    candidate?.relevantMeta,
    sched,
    clear,
    setExplorationReveal,
    scrollAfterExpand,
  )
  const onClosureRevealComplete = useCallback(() => setClosureComplete(true), [])

  useMirrorClosureReveal(
    showSummary,
    closureMessages,
    setClosureReveal,
    onClosureRevealComplete,
  )

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

  const advanceFromIntentionFields = useCallback(() => {
    const wenn = wennText.trim()
    const dann = dannText.trim()
    if (wenn && dann) {
      setShowReminderStep(true)
      scrollDown(true)
      return
    }
    setClosureMode('session_only')
    resetClosure()
    setShowSummary(true)
    scrollDown(true)
  }, [wennText, dannText, scrollDown, resetClosure])

  const handleExploration = useCallback(
    (kind: MirrorExplorationKind) => {
      if (!candidate) return
      const shownIds = new Set([
        ...candidate.entries.map(e => e.id),
        ...explorationBlocks.flatMap(b => b.entries.map(e => e.id)),
      ])
      const entries = entriesForMirrorExploration(kind, candidate, allEntries).filter(
        e => !shownIds.has(e.id),
      )
      if (!entries.length) return

      setExplorationBlocks(prev => [
        ...prev,
        {
          id: `explore-${kind}-${Date.now()}`,
          kind,
          intro: pickMirrorExplorationIntro(kind),
          entries,
        },
      ])
      setUsedExplorationKinds(prev => new Set([...prev, kind]))
      scrollDown(true)
    },
    [candidate, allEntries, explorationBlocks, scrollDown],
  )

  const finishIntentionAndSummary = useCallback(async (durationLabel?: string | null) => {
    const wenn = wennText.trim()
    const dann = dannText.trim()
    const chosenDuration = durationLabel !== undefined ? durationLabel : duration
    const reminderType = wenn && dann ? reminderTypeForLabel(chosenDuration) : null
    if (durationLabel !== undefined) setDuration(durationLabel)
    if (wenn && dann) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('implementation_intentions').insert({
          user_id: user.id,
          wenn_text: wenn,
          dann_text: dann,
          wants_reminder: !!reminderType,
          reminder_type: reminderType,
          expires_at: reminderType ? intentionExpiresAt(reminderType) : null,
          active: true,
        })
      }
      if (sessionIdRef.current) {
        await supabase
          .from('mirror_sessions')
          .update({
            intention_wenn: wenn,
            intention_dann: dann,
            reminder_type: reminderType === '7days' ? 'week' : reminderType,
          })
          .eq('id', sessionIdRef.current)
      }
      if (reminderType) {
        void registerPushSubscription()
      }
    }
    setClosureMode(reminderType ? 'reminder' : 'no_reminder')
    resetClosure()
    setShowSummary(true)
    scrollDown(true)
  }, [wennText, dannText, duration, supabase, scrollDown, resetClosure])

  const emptyState = !candidate

  return (
    <MirrorFlowChrome onClose={onClose}>
      {phase === 'loading' && <MirrorFlowLoading loadingStep={loadingStep} onClose={onClose} />}

      {phase === 'mirror' && (
        <MirrorFlowChat scrollRef={scrollRef} showTitle>
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

          {emptyState && narrativeDone && (
            <MirrorExpandShell open>
              <MirrorEmptyClose onClose={onClose} />
            </MirrorExpandShell>
          )}

          {!emptyState && (
            <>
              <MirrorExpandShell open={narrativeDone}>
                <MirrorReflectionSection
                  blocksLength={blocks.length}
                  reflectionText={reflectionText}
                  setReflectionText={setReflectionText}
                  sessionIdRef={sessionIdRef}
                  supabase={supabase}
                  explorationOffers={explorationOffers}
                  usedExplorationKinds={usedExplorationKinds}
                  explorationBlocks={explorationBlocks}
                  explorationReveal={explorationReveal}
                  relevantMeta={candidate?.relevantMeta}
                  onExplore={handleExploration}
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
                  showReminderStep={showReminderStep}
                  duration={duration}
                  setDuration={setDuration}
                  onFieldsContinue={advanceFromIntentionFields}
                  onReminderContinue={label => void finishIntentionAndSummary(label)}
                />
              </MirrorExpandShell>
            </>
          )}

          {!emptyState && (
            <MirrorExpandShell open={showSummary}>
              <MirrorClosureSection
                blocksLength={blocks.length}
                messages={closureMessages}
                reveal={closureReveal}
                complete={closureComplete}
                onClose={() => (onClose ? onClose() : undefined)}
              />
            </MirrorExpandShell>
          )}
        </MirrorFlowChat>
      )}
    </MirrorFlowChrome>
  )
}
