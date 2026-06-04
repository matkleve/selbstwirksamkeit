'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MirrorRevealWords } from '@/components/mirror/MirrorRevealWords'
import { MirrorTimelineRow } from '@/components/mirror/MirrorFlow.timeline'
import type { ClosureRevealState } from '@/components/mirror/MirrorFlow.useClosureReveal'
import { MirrorReminderChips } from '@/components/mirror/MirrorFlow.reminder'
import { MirrorReflectionExploration } from '@/components/mirror/MirrorReflectionExploration'
import { MirrorExpandShell } from '@/components/mirror/MirrorExpandShell'
import { splitRevealWords } from '@/lib/mirrorReveal'
import type { ExplorationBlockReveal } from '@/components/mirror/MirrorFlow.useExplorationReveal'
import type {
  MirrorExplorationBlock,
  MirrorExplorationKind,
  MirrorExplorationOffers,
} from '@/lib/mirrorExploration'
import type { RefObject } from 'react'

function MirrorWeiterButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="gold"
        onClick={onClick}
        disabled={disabled}
        className="max-w-[11rem] w-full"
        size="lg"
      >
        Weiter
        <ArrowRight size={18} strokeWidth={2} aria-hidden />
      </Button>
    </div>
  )
}

export function MirrorReflectionSection({
  blocksLength,
  reflectionText,
  setReflectionText,
  sessionIdRef,
  supabase,
  explorationOffers,
  usedExplorationKinds,
  explorationBlocks,
  explorationReveal,
  relevantMeta,
  onExplore,
  onContinue,
}: {
  blocksLength: number
  reflectionText: string
  setReflectionText: (v: string) => void
  sessionIdRef: RefObject<string | null>
  supabase: SupabaseClient
  explorationOffers: MirrorExplorationOffers
  usedExplorationKinds: ReadonlySet<MirrorExplorationKind>
  explorationBlocks: MirrorExplorationBlock[]
  explorationReveal: Record<string, ExplorationBlockReveal>
  relevantMeta?: string[]
  onExplore: (kind: MirrorExplorationKind) => void
  onContinue: () => void
}) {
  const hasExploration =
    explorationBlocks.length > 0 ||
    (['more', 'positive', 'contrast'] as const).some(
      k => explorationOffers[k] && !usedExplorationKinds.has(k),
    )

  return (
    <div className="flex flex-col">
      {hasExploration && (
        <MirrorReflectionExploration
          offers={explorationOffers}
          usedKinds={usedExplorationKinds}
          blocks={explorationBlocks}
          revealByBlock={explorationReveal}
          relevantMeta={relevantMeta}
          markerBaseIdx={blocksLength}
          onExplore={onExplore}
        />
      )}

      <MirrorTimelineRow markerType="reflection" markerIdx={blocksLength + 50}>
      <div className="flex flex-col gap-3">
        <Textarea
          value={reflectionText}
          onChange={e => setReflectionText(e.target.value)}
          onBlur={() => {
            if (!sessionIdRef.current) return
            void supabase
              .from('mirror_sessions')
              .update({ user_response: reflectionText.trim() || null })
              .eq('id', sessionIdRef.current)
          }}
          placeholder="…"
          rows={3}
          className="w-full"
        />
        <MirrorWeiterButton onClick={onContinue} />
      </div>
    </MirrorTimelineRow>
    </div>
  )
}

export function MirrorIntentionSection({
  blocksLength,
  wennText,
  setWennText,
  dannText,
  setDannText,
  showReminderStep,
  duration,
  setDuration,
  onFieldsContinue,
  onReminderContinue,
}: {
  blocksLength: number
  wennText: string
  setWennText: (v: string) => void
  dannText: string
  setDannText: (v: string) => void
  showReminderStep: boolean
  duration: string | null
  setDuration: (v: string | null) => void
  onFieldsContinue: () => void
  onReminderContinue: (label: string) => void
}) {
  return (
    <>
      <MirrorTimelineRow markerType="intention" markerIdx={blocksLength + 1}>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Wenn', value: wennText, set: setWennText, ph: 'es 21 Uhr wird · ich heimkomme' },
            { label: 'Dann', value: dannText, set: setDannText, ph: 'atme ich dreimal durch' },
          ].map(row => (
            <div key={row.label} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
              <span className="shrink-0 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3 sm:w-9">
                {row.label}
              </span>
              <Input
                value={row.value}
                onChange={e => row.set(e.target.value)}
                placeholder={row.ph}
                className="min-w-0 flex-1"
              />
            </div>
          ))}

          <MirrorWeiterButton onClick={onFieldsContinue} />
        </div>
      </MirrorTimelineRow>

      <MirrorExpandShell open={showReminderStep}>
        <MirrorTimelineRow markerType="reminder" markerIdx={blocksLength + 2}>
          <MirrorReminderChips
            onSelect={label => {
              setDuration(label)
              onReminderContinue(label)
            }}
          />
        </MirrorTimelineRow>
      </MirrorExpandShell>
    </>
  )
}

export function MirrorClosureSection({
  blocksLength,
  messages,
  reveal,
  complete,
  onClose,
}: {
  blocksLength: number
  messages: string[]
  reveal: ClosureRevealState
  complete: boolean
  onClose?: () => void
}) {
  const router = useRouter()
  const handleClose = () => (onClose ? onClose() : router.push('/mirror'))

  return (
    <div className="flex flex-col gap-4">
      {messages.map((text, i) => {
        if (i > reveal.line) return null
        const words = splitRevealWords(text)
        const visible = i < reveal.line ? words.length : reveal.words
        return (
          <MirrorTimelineRow
            key={i}
            markerType={i === 0 ? 'summary' : 'summary'}
            markerIdx={blocksLength + 3 + i}
          >
            <MirrorRevealWords
              as="p"
              words={words}
              visibleCount={visible}
              showCursor={!complete && i === reveal.line && visible < words.length}
              className="font-display text-[1.0625rem] leading-snug text-ink-2"
            />
          </MirrorTimelineRow>
        )
      })}

      {complete && (
        <div className="flex justify-end pt-1">
          <Button type="button" variant="gold" size="lg" onClick={handleClose}>
            Abschließen
          </Button>
        </div>
      )}
    </div>
  )
}
