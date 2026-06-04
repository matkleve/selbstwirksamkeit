'use client'

import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react'
import { ArrowLeftRight, ArrowRight, Bell, Circle, Pencil, Quote } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { MirrorCandidate } from '@/lib/patternDetection'
import { mirrorTransitionText, formatMirrorDateTime } from '@/lib/mirrorTransition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { EntryDisplay } from '@/components/entry'
import { MirrorRevealWords } from '@/components/mirror/MirrorRevealWords'
import {
  MIRROR_REVEAL,
  splitRevealWords,
  scheduleWordTicks,
  entryChipUnitCount,
} from '@/lib/mirrorReveal'
import { cn } from '@/lib/cn'

const SUMMARY_TEXT = 'Du hast heute hingeschaut. Das zählt.'

const LOADING_STEPS = [
  'Lese deine Einträge…',
  'Suche nach Mustern…',
  'Gleiche Zeiträume ab…',
  'Bereite deinen Spiegel vor…',
]

const REMINDER_OPTIONS = ['Heute', '3 Tage', 'Diese Woche', 'Kein Reminder'] as const

type NarrativeBlock =
  | { id: string; type: 'text'; text: string; muted?: boolean }
  | { id: string; type: 'entry'; entry: MirrorCandidate['entries'][number] }
  | { id: string; type: 'transition'; text: string }
  | { id: string; type: 'question'; text: string }

interface BlockState {
  visible: boolean
  wordCount: number
  entryHeaderWords: number
  entryBodyWords: number
  entryChips: number
}

const emptyBlockState = (): BlockState => ({
  visible: false,
  wordCount: 0,
  entryHeaderWords: 0,
  entryBodyWords: 0,
  entryChips: 0,
})

const SPINE_GRID = 'grid grid-cols-[2.5rem_minmax(0,1fr)]'

function MarkerIcon({ type, idx }: { type: string; idx: number }) {
  const iconClass = 'size-2.5 shrink-0 stroke-[2.25]'
  switch (type) {
    case 'entry':
      return <Quote className={iconClass} aria-hidden />
    case 'transition':
      return <ArrowLeftRight className={iconClass} aria-hidden />
    case 'question':
      return <span className="text-[0.625rem] font-semibold leading-none">?</span>
    case 'reflection':
    case 'intention':
      return <Pencil className={iconClass} aria-hidden />
    case 'reminder':
      return <Bell className={iconClass} aria-hidden />
    case 'summary':
      return <Circle className="size-1.5 fill-current stroke-none" aria-hidden />
    default:
      return (
        <Circle
          className={cn('fill-current stroke-none', idx === 0 ? 'size-1' : 'size-1')}
          aria-hidden
        />
      )
  }
}

function SpineMarker({ type, idx }: { type: string; idx: number }) {
  return (
    <div
      className="relative z-[2] flex size-5 shrink-0 items-center justify-center rounded-full border border-edge bg-[var(--background)] text-ink-2"
      aria-hidden
    >
      <MarkerIcon type={type} idx={idx} />
    </div>
  )
}

function TimelineRow({
  markerType,
  markerIdx,
  className,
  children,
}: {
  markerType: string
  markerIdx: number
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('mb-5', className)}>
      <div className={SPINE_GRID}>
        <div className="flex justify-center self-start pt-0.5">
          <SpineMarker type={markerType} idx={markerIdx} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}

function buildNarrativeBlocks(candidate: MirrorCandidate | null): NarrativeBlock[] {
  if (!candidate) {
    return [
      {
        id: 'empty',
        type: 'text',
        text: 'Noch zu wenige Muster. Schreib weiter — ich schaue dann nochmal.',
        muted: true,
      },
    ]
  }

  const blocks: NarrativeBlock[] = [{ id: 'intro', type: 'text', text: candidate.introText }]

  candidate.entries.forEach((entry, i) => {
    blocks.push({ id: `entry-${i}`, type: 'entry', entry })
    const next = candidate.entries[i + 1]
    if (next) {
      blocks.push({
        id: `transition-${i}`,
        type: 'transition',
        text: mirrorTransitionText(entry.created_at, next.created_at),
      })
    }
  })

  blocks.push({ id: 'question', type: 'question', text: candidate.question })
  return blocks
}

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

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollAnimatingRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const supabase = createClient()

  const sched = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }
  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  /** Ease viewport toward bottom as content grows — continuous push-up, no snap. */
  const followScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (scrollAnimatingRef.current) return
    scrollAnimatingRef.current = true

    const tick = () => {
      const viewport = scrollRef.current
      if (!viewport) {
        scrollAnimatingRef.current = false
        return
      }
      const target = viewport.scrollHeight - viewport.clientHeight
      const delta = target - viewport.scrollTop
      if (Math.abs(delta) < 0.5) {
        viewport.scrollTop = target
        scrollAnimatingRef.current = false
        return
      }
      viewport.scrollTop += delta * 0.11
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [])

  const scrollDown = useCallback(
    (smooth = false) => {
      const el = scrollRef.current
      if (!el) return
      if (smooth) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
        return
      }
      followScroll()
    },
    [followScroll],
  )

  useEffect(() => {
    clear()
    LOADING_STEPS.forEach((_, i) => {
      if (i > 0) sched(() => setLoadingStep(i), i * MIRROR_REVEAL.loadingStep)
    })
    sched(() => {
      const init: Record<string, BlockState> = {}
      blocks.forEach(b => {
        init[b.id] = emptyBlockState()
      })
      setStates(init)
      setNarrativeDone(false)
      setPastReflection(false)
      setShowSummary(false)
      setSummaryWords(0)
      setPhase('mirror')
    }, LOADING_STEPS.length * MIRROR_REVEAL.loadingStep + 500)
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks])

  useEffect(() => {
    if (phase !== 'mirror' || !candidate) return
    void supabase
      .from('mirror_sessions')
      .insert({
        pattern_found: true,
        pattern_type: candidate.source,
        signal_strength: candidate.signalStrength,
        entries_shown: candidate.entryIds,
        question_asked: candidate.question,
      })
      .select('id')
      .single()
      .then(({ data }) => {
        if (data?.id) sessionIdRef.current = data.id
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, candidate])

  useEffect(() => {
    if (phase !== 'mirror') return
    const viewport = scrollRef.current
    const messages = viewport?.querySelector('.mirror-chat-messages')
    if (!viewport || !messages) return

    const ro = new ResizeObserver(() => followScroll())
    ro.observe(messages)
    followScroll()
    return () => ro.disconnect()
  }, [phase, followScroll, narrativeDone, pastReflection, showSummary])

  useEffect(() => {
    if (phase !== 'mirror') return
    clear()
    let d = 400

    blocks.forEach(block => {
      if (block.type === 'entry') {
        const headerLen = splitRevealWords(formatMirrorDateTime(block.entry.created_at)).length
        const bodyLen = splitRevealWords(block.entry.text).length
        const chipLen = entryChipUnitCount(block.entry, candidate?.relevantMeta)

        d = scheduleWordTicks(
          headerLen,
          d,
          n => {
            setStates(p => ({
              ...p,
              [block.id]: { ...p[block.id], visible: true, entryHeaderWords: n },
            }))
          },
          sched,
        )

        d = scheduleWordTicks(
          bodyLen,
          d,
          n => {
            setStates(p => ({ ...p, [block.id]: { ...p[block.id], entryBodyWords: n } }))
          },
          sched,
        )

        for (let ci = 0; ci < chipLen; ci++) {
          d += MIRROR_REVEAL.chip
          const count = ci + 1
          sched(() => {
            setStates(p => ({ ...p, [block.id]: { ...p[block.id], entryChips: count } }))
          }, d)
        }
      } else if (
        block.type === 'text' ||
        block.type === 'question' ||
        block.type === 'transition'
      ) {
        const words = splitRevealWords(block.text)
        d = scheduleWordTicks(
          words.length,
          d,
          n => {
            setStates(p => ({
              ...p,
              [block.id]: { ...p[block.id], visible: true, wordCount: n },
            }))
          },
          sched,
        )
      }

      d += MIRROR_REVEAL.blockGap
    })

    sched(() => setNarrativeDone(true), d)

    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, blocks, candidate?.relevantMeta])

  useEffect(() => {
    if (!showSummary) {
      setSummaryWords(0)
      return
    }
    const summaryTimers: ReturnType<typeof setTimeout>[] = []
    const schedSummary = (fn: () => void, ms: number) => {
      summaryTimers.push(setTimeout(fn, ms))
    }
    const words = splitRevealWords(SUMMARY_TEXT)
    let t = 300
    scheduleWordTicks(
      words.length,
      t,
      n => setSummaryWords(n),
      schedSummary,
    )
    return () => summaryTimers.forEach(clearTimeout)
  }, [showSummary])

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

  const handleSaveIntention = async () => {
    if (!wennText.trim() || !dannText.trim()) return
    const reminderMap: Record<string, string> = {
      Heute: 'today',
      '3 Tage': '3days',
      'Diese Woche': '7days',
    }
    await supabase.from('implementation_intentions').insert({
      wenn_text: wennText.trim(),
      dann_text: dannText.trim(),
      wants_reminder: !!duration && duration !== 'Kein Reminder',
      reminder_type: duration ? (reminderMap[duration] ?? null) : null,
      active: true,
    })
    setShowSummary(true)
    scrollDown(true)
  }

  useEffect(() => {
    if (pastReflection && !wennText && !dannText) {
      setShowSummary(true)
    }
  }, [pastReflection, wennText, dannText])

  const intentionComplete = Boolean(wennText.trim() && dannText.trim())

  const emptyState = !candidate

  return (
    <>
      {phase === 'loading' && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-11 bg-[var(--background)] text-[var(--foreground)]"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="flex size-14 items-center justify-center rounded-full border border-edge bg-card text-2xl"
            aria-hidden
          >
            🪞
          </div>

          <div className="flex min-w-[13.125rem] flex-col gap-2">
            {LOADING_STEPS.map((step, i) =>
              loadingStep >= i ? (
                <div
                  key={i}
                  className={cn(
                    'mirror-fade-in flex items-center gap-2.5 text-[0.8125rem] tracking-wide',
                    loadingStep === i ? 'text-ink' : 'text-ink-3',
                  )}
                >
                  <span className="w-3 text-[0.5625rem] opacity-70" aria-hidden>
                    {loadingStep > i ? '✓' : '·'}
                  </span>
                  {step}
                </div>
              ) : null,
            )}
          </div>

          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="mirror-dot-pulse size-1 rounded-full bg-ink-3"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {phase === 'mirror' && (
      <div ref={scrollRef} className="mirror-chat-viewport">
        <div className="mirror-chat-stack pt-1 pb-2">
          <div className="mirror-chat-spacer" aria-hidden />
          <div className="mirror-chat-messages">
          <div
            className="pointer-events-none absolute top-0 bottom-0 left-5 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-edge to-transparent"
            aria-hidden
          />

        {blocks.map((block, idx) => {
          if (!states[block.id]?.visible) return null

          return (
            <TimelineRow key={block.id} markerType={block.type} markerIdx={idx}>
              {block.type === 'text' && (
                <MirrorRevealWords
                  as="p"
                  words={blockWords(block.text)}
                  visibleCount={wordProgress(block.id, block.text)}
                  showCursor={isWordTyping(block.id, block.text)}
                  className={cn(
                    'font-display text-[1.0625rem] leading-snug text-[var(--foreground)]',
                    block.muted ? 'text-ink-3' : 'text-ink-2',
                  )}
                />
              )}

              {block.type === 'question' && (
                <MirrorRevealWords
                  as="p"
                  words={blockWords(block.text)}
                  visibleCount={wordProgress(block.id, block.text)}
                  showCursor={isWordTyping(block.id, block.text)}
                  className="font-display text-base italic leading-snug text-ink-2"
                />
              )}

              {block.type === 'transition' && (
                <MirrorRevealWords
                  as="p"
                  words={blockWords(block.text)}
                  visibleCount={wordProgress(block.id, block.text)}
                  showCursor={isWordTyping(block.id, block.text)}
                  className="font-display text-sm italic text-ink-3"
                />
              )}

              {block.type === 'entry' && (
                <EntryDisplay
                  entry={block.entry}
                  variant="chips-closed"
                  header="mirror"
                  size="sm"
                  lines={2}
                  menu={false}
                  card
                  relevantMeta={candidate?.relevantMeta}
                  reveal={{
                    headerWordCount: states[block.id]?.entryHeaderWords ?? 0,
                    bodyWordCount: states[block.id]?.entryBodyWords ?? 0,
                    chipCount: states[block.id]?.entryChips ?? 0,
                  }}
                />
              )}
            </TimelineRow>
          )
        })}

        {narrativeDone && !emptyState && (
          <TimelineRow markerType="reflection" markerIdx={blocks.length}>
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
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void continuePastReflection()}
                  className="max-w-[11rem] w-full"
                  size="lg"
                >
                  Weiter
                  <ArrowRight size={18} strokeWidth={2} aria-hidden />
                </Button>
              </div>
            </div>
          </TimelineRow>
        )}

        {pastReflection && !emptyState && (
          <>
            <TimelineRow markerType="intention" markerIdx={blocks.length + 1}>
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

                <Button
                  type="button"
                  onClick={() => void handleSaveIntention()}
                  disabled={!intentionComplete}
                  className="w-full"
                  size="lg"
                >
                  Intention speichern
                </Button>
              </div>
            </TimelineRow>

            {intentionComplete && (
              <TimelineRow markerType="reminder" markerIdx={blocks.length + 2}>
                <div className="flex flex-wrap gap-1.5">
                  {REMINDER_OPTIONS.map(opt => (
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
              </TimelineRow>
            )}
          </>
        )}

        {showSummary && (
          <TimelineRow markerType="summary" markerIdx={blocks.length + 3}>
            <MirrorRevealWords
              as="p"
              words={splitRevealWords(SUMMARY_TEXT)}
              visibleCount={summaryWords}
              showCursor={summaryWords < splitRevealWords(SUMMARY_TEXT).length}
              className="font-display text-[1.0625rem] leading-snug text-ink-3"
            />
          </TimelineRow>
        )}
          </div>
        </div>
      </div>
      )}
    </>
  )
}
