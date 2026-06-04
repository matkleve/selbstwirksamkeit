'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import type { MirrorCandidate } from '@/lib/patternDetection'
import { mirrorTransitionText } from '@/lib/mirrorTransition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EntryDisplay } from '@/components/entry'
import { cn } from '@/lib/cn'

const LOADING_STEPS = [
  'Lese deine Einträge…',
  'Suche nach Mustern…',
  'Gleiche Zeiträume ab…',
  'Bereite deinen Spiegel vor…',
]

const REMINDER_OPTIONS = ['Heute', '3 Tage', 'Diese Woche', 'Kein Reminder'] as const

type InternalBlock =
  | { id: string; type: 'text'; text: string; muted?: boolean }
  | { id: string; type: 'entry'; entry: MirrorCandidate['entries'][number] }
  | { id: string; type: 'transition'; text: string }
  | { id: string; type: 'question'; text: string }
  | { id: string; type: 'decision' }

interface BlockState {
  visible: boolean
  wordCount: number
}

const MARKER: Record<string, string> = { question: '?', decision: '→', entry: '❝', transition: '↔' }
const markerFor = (type: string, idx: number) => MARKER[type] ?? (idx === 0 ? '◦' : '·')

function buildBlocks(candidate: MirrorCandidate | null): InternalBlock[] {
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

  const blocks: InternalBlock[] = [{ id: 'intro', type: 'text', text: candidate.introText }]

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
  blocks.push({ id: 'decision', type: 'decision' })
  blocks.push({
    id: 'summary',
    type: 'text',
    text: 'Du hast heute hingeschaut. Das zählt.',
    muted: true,
  })
  return blocks
}

function SpineMarker({ type, idx, className }: { type: string; idx: number; className?: string }) {
  return (
    <div
      className={cn(
        'absolute -left-10 top-0.5 z-[2] flex size-5 min-h-5 min-w-5 items-center justify-center',
        'rounded-full border border-edge bg-[var(--background)] font-bold text-ink-2',
        type === 'question' ? 'text-[0.625rem]' : 'text-[0.6875rem]',
        className,
      )}
      aria-hidden
    >
      {markerFor(type, idx)}
    </div>
  )
}

function TypingCursor() {
  return <span className="mirror-blink">|</span>
}

export default function MirrorFlow({ candidate }: { candidate: MirrorCandidate | null }) {
  const blocks = useMemo(() => buildBlocks(candidate), [candidate])
  const [loadingStep, setLoadingStep] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'mirror'>('loading')
  const [states, setStates] = useState<Record<string, BlockState>>({})
  const [showDecision, setShowDecision] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [wennText, setWennText] = useState('')
  const [dannText, setDannText] = useState('')
  const [duration, setDuration] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const sched = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }
  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  const scrollDown = () =>
    setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 60)

  useEffect(() => {
    clear()
    LOADING_STEPS.forEach((_, i) => {
      if (i > 0) sched(() => setLoadingStep(i), i * 820)
    })
    sched(() => {
      const init: Record<string, BlockState> = {}
      blocks.forEach(b => {
        init[b.id] = { visible: false, wordCount: 0 }
      })
      setStates(init)
      setPhase('mirror')
    }, LOADING_STEPS.length * 820 + 400)
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks])

  useEffect(() => {
    if (phase !== 'mirror') return
    clear()
    let d = 300

    blocks.forEach(block => {
      sched(() => {
        setStates(p => ({ ...p, [block.id]: { ...p[block.id], visible: true } }))
        scrollDown()
      }, d)
      d += 320

      if (block.type === 'entry' || block.type === 'transition') {
        d += block.type === 'entry' ? 400 : 220
      }

      if ((block.type === 'text' || block.type === 'question') && block.text) {
        const words = block.text.split(' ')
        words.forEach((_, wi) => {
          sched(() => {
            setStates(p => ({ ...p, [block.id]: { ...p[block.id], wordCount: wi + 1 } }))
            if (wi === words.length - 1) scrollDown()
          }, d + wi * 88)
        })
        d += words.length * 88 + 300
      }

      if (block.type === 'decision') {
        sched(() => {
          setShowDecision(true)
          scrollDown()
        }, d)
        d += 200
      }
    })
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, blocks])

  const visWords = (id: string, text: string) =>
    text.split(' ').slice(0, states[id]?.wordCount ?? 0).join(' ')
  const isTyping = (id: string, text: string) =>
    (states[id]?.wordCount ?? 0) < text.split(' ').length

  const handleSave = async () => {
    if (!wennText || !dannText) return
    const reminderMap: Record<string, string> = {
      Heute: 'today',
      '3 Tage': '3days',
      'Diese Woche': '7days',
    }
    await supabase.from('implementation_intentions').insert({
      wenn_text: wennText,
      dann_text: dannText,
      wants_reminder: !!duration && duration !== 'Kein Reminder',
      reminder_type: duration ? (reminderMap[duration] ?? null) : null,
      active: true,
    })
    setSaved(true)
    scrollDown()
  }

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

      <div
        ref={scrollRef}
        className={cn(
          'relative pt-1 pl-10 transition-opacity duration-700',
          phase === 'mirror' ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div
          className="pointer-events-none absolute top-0 bottom-0 left-[0.9375rem] w-px bg-gradient-to-b from-transparent via-edge to-transparent"
          aria-hidden
        />

        {blocks.map((block, idx) => {
          if (!states[block.id]?.visible) return null

          return (
            <div key={block.id} className="relative mb-5 mirror-slide-up">
              <SpineMarker type={block.type} idx={idx} />

              {block.type === 'text' && (
                <p
                  className={cn(
                    'm-0 font-display text-[1.0625rem] leading-snug text-[var(--foreground)]',
                    block.muted ? 'text-ink-3' : 'text-ink-2',
                  )}
                >
                  {visWords(block.id, block.text)}
                  {isTyping(block.id, block.text) && <TypingCursor />}
                </p>
              )}

              {block.type === 'question' && (
                <p className="m-0 font-display text-base italic leading-snug text-ink-2">
                  {visWords(block.id, block.text)}
                  {isTyping(block.id, block.text) && <TypingCursor />}
                </p>
              )}

              {block.type === 'transition' && (
                <p className="mirror-fade m-0 font-display text-sm italic text-ink-3">{block.text}</p>
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
                />
              )}

              {block.type === 'decision' && showDecision && !showForm && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1">
                    Schließen
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setShowForm(true)
                      scrollDown()
                    }}
                  >
                    Wenn-Dann →
                  </Button>
                </div>
              )}
              {block.type === 'decision' && showForm && (
                <p className="m-0 font-display text-[0.8125rem] italic text-ink-3">
                  Intention gesetzt ↓
                </p>
              )}
            </div>
          )
        })}

        {showForm && !saved && (
          <div className="relative mb-5 mirror-slide-up">
            <SpineMarker type="intention" idx={99} />
            <div className="flex flex-col gap-3">
              {[
                { label: 'Wenn', value: wennText, set: setWennText, ph: 'dieses Muster wieder auftaucht' },
                { label: 'Dann', value: dannText, set: setDannText, ph: 'tue ich…' },
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

              <Button
                type="button"
                onClick={handleSave}
                disabled={!wennText || !dannText}
                className="w-full"
                size="lg"
              >
                Intention speichern
              </Button>
            </div>
          </div>
        )}

        {saved && (
          <div className="relative mb-5 mirror-fade">
            <SpineMarker type="saved" idx={99} className="text-ok" />
            <p className="m-0 font-display text-[0.9375rem] italic text-ok">
              Wenn {wennText}, dann {dannText}.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
