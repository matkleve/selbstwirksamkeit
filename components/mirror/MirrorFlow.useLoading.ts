'use client'

import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MirrorCandidate } from '@/lib/patternDetection'
import { patternTextFromCandidate } from '@/lib/mirror-session'
import { MIRROR_LOADING_STEPS } from '@/components/mirror/MirrorFlow.constants'
import { emptyBlockState, type BlockState, type NarrativeBlock } from '@/components/mirror/MirrorFlow.types'
import { MIRROR_REVEAL } from '@/lib/mirrorReveal'

export function initBlockStates(blocks: NarrativeBlock[]): Record<string, BlockState> {
  const init: Record<string, BlockState> = {}
  blocks.forEach(b => {
    init[b.id] = emptyBlockState()
  })
  return init
}

export function useMirrorLoadingPhase(
  blocks: NarrativeBlock[],
  sched: (fn: () => void, ms: number) => void,
  clear: () => void,
  setLoadingStep: (n: number) => void,
  setStates: Dispatch<SetStateAction<Record<string, BlockState>>>,
  setNarrativeDone: (v: boolean) => void,
  setPastReflection: (v: boolean) => void,
  setShowSummary: (v: boolean) => void,
  setSummaryWords: (n: number) => void,
  setPhase: (p: 'loading' | 'mirror') => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    clear()
    MIRROR_LOADING_STEPS.forEach((_, i) => {
      if (i > 0) sched(() => setLoadingStep(i), i * MIRROR_REVEAL.loadingStep)
    })
    sched(() => {
      setStates(initBlockStates(blocks))
      setNarrativeDone(false)
      setPastReflection(false)
      setShowSummary(false)
      setSummaryWords(0)
      setPhase('mirror')
    }, MIRROR_LOADING_STEPS.length * MIRROR_REVEAL.loadingStep + 500)
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, enabled])
}

export function useMirrorSession(
  phase: 'loading' | 'mirror',
  candidate: MirrorCandidate | null,
  sessionIdRef: RefObject<string | null>,
  supabase: SupabaseClient,
) {
  useEffect(() => {
    if (phase !== 'mirror' || !candidate) return
    void supabase
      .from('mirror_sessions')
      .insert({
        pattern_type: candidate.source,
        pattern_text: patternTextFromCandidate(candidate),
        anchor_entry_ids: candidate.entryIds,
        signal_strength: candidate.signalStrength,
      })
      .select('id')
      .single()
      .then(({ data }) => {
        if (data?.id) sessionIdRef.current = data.id
      })
  }, [phase, candidate, sessionIdRef, supabase])
}
