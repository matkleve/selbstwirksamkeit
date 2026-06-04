'use client'

import { ArrowRight } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MirrorRevealWords } from '@/components/mirror/MirrorRevealWords'
import { MirrorTimelineRow } from '@/components/mirror/MirrorFlow.timeline'
import { MIRROR_REMINDER_OPTIONS, MIRROR_SUMMARY_TEXT } from '@/components/mirror/MirrorFlow.constants'
import { MirrorExpandShell } from '@/components/mirror/MirrorExpandShell'
import { splitRevealWords } from '@/lib/mirrorReveal'
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
  onContinue,
}: {
  blocksLength: number
  reflectionText: string
  setReflectionText: (v: string) => void
  sessionIdRef: RefObject<string | null>
  supabase: SupabaseClient
  onContinue: () => void
}) {
  return (
    <MirrorTimelineRow markerType="reflection" markerIdx={blocksLength}>
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
  )
}

export function MirrorIntentionSection({
  blocksLength,
  wennText,
  setWennText,
  dannText,
  setDannText,
  intentionComplete,
  duration,
  setDuration,
  onContinue,
}: {
  blocksLength: number
  wennText: string
  setWennText: (v: string) => void
  dannText: string
  setDannText: (v: string) => void
  intentionComplete: boolean
  duration: string | null
  setDuration: (v: string | null) => void
  onContinue: () => void
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

          <MirrorWeiterButton onClick={onContinue} />
        </div>
      </MirrorTimelineRow>

      <MirrorExpandShell open={intentionComplete}>
        <MirrorTimelineRow markerType="reminder" markerIdx={blocksLength + 2}>
          <div className="flex flex-wrap gap-1.5">
            {MIRROR_REMINDER_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setDuration(duration === opt ? null : opt)}
                className="cursor-pointer rounded-chip border-0 bg-transparent p-0"
              >
                <Badge variant={duration === opt ? 'filled' : 'default'}>{opt}</Badge>
              </button>
            ))}
          </div>
        </MirrorTimelineRow>
      </MirrorExpandShell>
    </>
  )
}

export function MirrorSummarySection({
  blocksLength,
  summaryWords,
}: {
  blocksLength: number
  summaryWords: number
}) {
  const words = splitRevealWords(MIRROR_SUMMARY_TEXT)
  return (
    <MirrorTimelineRow markerType="summary" markerIdx={blocksLength + 3}>
      <MirrorRevealWords
        as="p"
        words={words}
        visibleCount={summaryWords}
        showCursor={summaryWords < words.length}
        className="font-display text-[1.0625rem] leading-snug text-ink-3"
      />
    </MirrorTimelineRow>
  )
}
