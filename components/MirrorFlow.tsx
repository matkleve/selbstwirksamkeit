'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { PatternResult, PatternBlock } from '@/lib/patternDetection'

const LOADING_STEPS = [
  'Lese deine letzten Einträge…',
  'Erkenne Muster…',
  'Gleiche Zeiträume ab…',
  'Bereite deinen Spiegel vor…',
]

type InternalBlock =
  | (PatternBlock & { id: string })
  | { id: string; type: 'question'; text: string }
  | { id: string; type: 'decision' }
  | { id: string; type: 'summary'; text: string; muted: true }

interface BlockState {
  visible: boolean
  wordCount: number
  entryPhase: 'hidden' | 'date' | 'text' | 'chips'
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

const MARKER: Record<string, string> = {
  question: '?', decision: '→', summary: '◎', entry: '❝',
}
function markerFor(type: string, idx: number) {
  return MARKER[type] ?? (idx === 0 ? '◦' : '·')
}

export default function MirrorFlow({ pattern }: { pattern: PatternResult }) {
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
    const id = setTimeout(fn, ms); timers.current.push(id)
  }
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const scrollDown = () => setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 60)

  // Build block list
  const blocks: InternalBlock[] = [
    ...pattern.blocks.map((b, i) => ({ ...b, id: `b${i}` })),
    ...(pattern.question ? [{ id: 'question', type: 'question' as const, text: pattern.question }] : []),
    { id: 'decision', type: 'decision' as const },
    { id: 'summary', type: 'summary' as const, text: 'Du hast heute hingeschaut. Das zählt.', muted: true as const },
  ]

  // Loading phase
  useEffect(() => {
    clear()
    LOADING_STEPS.forEach((_, i) => { if (i > 0) sched(() => setLoadingStep(i), i * 820) })
    sched(() => {
      const init: Record<string, BlockState> = {}
      blocks.forEach(b => { init[b.id] = { visible: false, wordCount: 0, entryPhase: 'hidden' } })
      setStates(init)
      setPhase('mirror')
    }, LOADING_STEPS.length * 820 + 400)
    return clear
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mirror animation
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

      if (block.type === 'entry' && 'entry' in block && block.entry) {
        sched(() => setStates(p => ({ ...p, [block.id]: { ...p[block.id], entryPhase: 'date' } })), d)
        d += 240
        const text = block.entry.text.slice(0, 120)
        text.split(' ').forEach((_, wi) => {
          sched(() => {
            setStates(p => ({ ...p, [block.id]: { ...p[block.id], wordCount: wi + 1, entryPhase: 'text' } }))
            if (wi === text.split(' ').length - 1) scrollDown()
          }, d + wi * 85)
        })
        d += text.split(' ').length * 85 + 260
        if ('chips' in block && block.chips?.length) {
          sched(() => {
            setStates(p => ({ ...p, [block.id]: { ...p[block.id], entryPhase: 'chips' } }))
          }, d); d += 340
        }
      }

      const textBlock = block as { text?: string }
      if (textBlock.text && block.type !== 'entry' && block.type !== 'decision') {
        textBlock.text.split(' ').forEach((_, wi) => {
          sched(() => {
            setStates(p => ({ ...p, [block.id]: { ...p[block.id], wordCount: wi + 1 } }))
            if (wi === textBlock.text!.split(' ').length - 1) scrollDown()
          }, d + wi * 88)
        })
        d += textBlock.text.split(' ').length * 88 + 300
      }

      if (block.type === 'decision') {
        sched(() => { setShowDecision(true); scrollDown() }, d); d += 200
      }
    })
    return clear
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const words = (id: string, text: string) =>
    text.split(' ').slice(0, states[id]?.wordCount ?? 0).join(' ')
  const typing = (id: string, text: string) =>
    (states[id]?.wordCount ?? 0) < text.split(' ').length

  const handleSave = async () => {
    if (!wennText || !dannText) return
    const reminderMap: Record<string, string> = { 'Heute': 'today', '3 Tage': '3days', 'Diese Woche': '7days' }
    await supabase.from('implementation_intentions').insert({
      wenn_text: wennText, dann_text: dannText,
      wants_reminder: !!duration && duration !== 'Kein Reminder',
      reminder_type: duration ? (reminderMap[duration] ?? null) : null,
      active: true,
    })
    setSaved(true); scrollDown()
  }

  const GOLD = 'var(--mirror-gold)'
  const SPINE = 'rgba(200,168,75,0.3)'

  const markerNode = (type: string, idx: number, extra?: string) => (
    <div style={{
      position: 'absolute', left: -33, top: 2,
      width: 18, height: 18, borderRadius: '50%',
      background: 'var(--bg-base)',
      border: `1px solid ${SPINE}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: type === 'question' ? 9 : 8,
      color: extra ?? GOLD, fontWeight: 700, zIndex: 2,
    }}>
      {markerFor(type, idx)}
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes mirrorSlideUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes mirrorFadeIn {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes mirrorFade { from{opacity:0} to{opacity:1} }
        @keyframes mirrorBlink { 0%,100%{opacity:0} 50%{opacity:.4} }
        @keyframes mirrorDot {
          0%,80%,100%{transform:scale(.5);opacity:.2}
          40%{transform:scale(1);opacity:.9}
        }
      `}</style>

      {/* Loading overlay */}
      {phase === 'loading' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: '#0D0A07',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 44,
        }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%',
            border: '1.5px solid #2A1E10',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>🪞</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 210 }}>
            {LOADING_STEPS.map((step, i) => (
              loadingStep >= i ? (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  fontSize: '0.8125rem', letterSpacing: '0.015em',
                  color: loadingStep === i ? GOLD : 'rgba(200,168,75,0.28)',
                  animation: 'mirrorFadeIn 0.4s ease forwards',
                }}>
                  <span style={{ fontSize: 9, width: 12, opacity: .7 }}>
                    {loadingStep > i ? '✓' : '·'}
                  </span>
                  {step}
                </div>
              ) : null
            ))}
          </div>

          <div style={{ display: 'flex', gap: 7 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 4, height: 4, borderRadius: '50%',
                background: 'rgba(200,168,75,0.35)',
                animation: `mirrorDot 1.4s ease ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Mirror content */}
      <div
        ref={scrollRef}
        style={{
          opacity: phase === 'mirror' ? 1 : 0,
          transition: 'opacity 0.7s ease',
          position: 'relative',
          paddingLeft: 40,
          paddingTop: 4,
        }}
      >
        {/* Spine */}
        <div style={{
          position: 'absolute', left: 15, top: 0, bottom: 0, width: 1.5,
          background: `linear-gradient(to bottom, transparent 0, ${SPINE} 16px, ${SPINE} calc(100% - 16px), transparent 100%)`,
          pointerEvents: 'none',
        }} />

        {blocks.map((block, idx) => {
          if (!states[block.id]?.visible) return null
          const st = states[block.id]

          return (
            <div key={block.id} style={{
              position: 'relative', marginBottom: 22,
              animation: 'mirrorSlideUp 0.42s cubic-bezier(.34,1.4,.64,1) forwards',
            }}>
              {markerNode(block.type, idx)}

              {/* TEXT / QUESTION / SUMMARY */}
              {(block.type === 'text' || block.type === 'question' || block.type === 'summary') && (block as {text?: string}).text && (
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-display), Georgia, serif',
                  fontSize: block.type === 'question' ? '1rem' : '1.0625rem',
                  fontStyle: block.type === 'question' ? 'italic' : 'normal',
                  lineHeight: 1.55, fontWeight: 400,
                  color: (block as {muted?: boolean}).muted ? 'var(--text-muted)' : 'var(--text-secondary)',
                }}>
                  {words(block.id, (block as {text: string}).text)}
                  {typing(block.id, (block as {text: string}).text) && (
                    <span style={{ animation: 'mirrorBlink 0.9s ease infinite' }}>|</span>
                  )}
                </p>
              )}

              {/* ENTRY */}
              {block.type === 'entry' && 'entry' in block && block.entry && (() => {
                const ep = st.entryPhase
                const text = block.entry.text.slice(0, 120)
                const chipsArr = ('chips' in block && block.chips) ? block.chips : []
                return (
                  <div style={{
                    borderRadius: 10, background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)', padding: '10px 12px',
                  }}>
                    {ep !== 'hidden' && (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', marginBottom: 6,
                        animation: 'mirrorFade 0.35s ease forwards',
                      }}>
                        <span style={{
                          fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-muted)',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>{fmtDate(block.entry.created_at)}</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {fmtTime(block.entry.created_at)}
                        </span>
                      </div>
                    )}
                    {(ep === 'text' || ep === 'chips') && (
                      <p style={{
                        margin: 0,
                        fontFamily: 'var(--font-display), Georgia, serif',
                        fontSize: '0.9375rem', fontStyle: 'italic',
                        color: 'var(--text-secondary)', lineHeight: 1.5,
                        minHeight: 20,
                      }}>
                        "{words(block.id, text)}
                        {typing(block.id, text)
                          ? <span style={{ animation: 'mirrorBlink 0.9s ease infinite' }}>|</span>
                          : '"'
                        }
                      </p>
                    )}
                    {ep === 'chips' && chipsArr.length > 0 && (
                      <div style={{
                        display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap',
                        animation: 'mirrorFade 0.35s ease forwards',
                      }}>
                        {chipsArr.map(c => (
                          <span key={c} style={{
                            fontSize: '0.6875rem', fontWeight: 500,
                            color: 'var(--valence-neg-mid)',
                            background: 'rgba(196,96,58,0.07)',
                            borderRadius: 20, padding: '2px 8px',
                            border: '1px solid rgba(196,96,58,0.15)',
                          }}>{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* DECISION */}
              {block.type === 'decision' && showDecision && !showForm && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    flex: 1, padding: '9px 0', borderRadius: 9,
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-muted)', fontSize: '0.8125rem',
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}>
                    Schließen
                  </button>
                  <button onClick={() => { setShowForm(true); scrollDown() }} style={{
                    flex: 1, padding: '9px 0', borderRadius: 9,
                    border: 'none', background: GOLD, color: 'white',
                    fontSize: '0.8125rem', fontWeight: 500,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}>
                    Wenn-Dann →
                  </button>
                </div>
              )}
              {block.type === 'decision' && showForm && (
                <p style={{
                  margin: 0, fontSize: '0.8125rem',
                  color: 'var(--text-muted)', fontStyle: 'italic',
                  fontFamily: 'var(--font-display), Georgia, serif',
                }}>Intention gesetzt ↓</p>
              )}
            </div>
          )
        })}

        {/* Wenn-Dann form */}
        {showForm && !saved && (
          <div style={{
            position: 'relative', marginBottom: 22,
            animation: 'mirrorSlideUp 0.42s cubic-bezier(.34,1.4,.64,1) forwards',
          }}>
            {markerNode('intention', 99)}

            {[
              { label: 'Wenn', value: wennText, set: setWennText, ph: 'es 21 Uhr wird · ich müde werde' },
              { label: 'Dann', value: dannText, set: setDannText, ph: 'atme ich dreimal durch' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12,
              }}>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
                  letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0, width: 36,
                }}>{row.label}</span>
                <input
                  value={row.value}
                  onChange={e => row.set(e.target.value)}
                  placeholder={row.ph}
                  style={{
                    flex: 1, border: 'none',
                    borderBottom: `1.5px solid ${row.value ? GOLD : 'var(--border)'}`,
                    background: 'transparent',
                    fontSize: '0.9375rem', fontStyle: 'italic',
                    fontFamily: 'var(--font-display), Georgia, serif',
                    color: 'var(--text-primary)', outline: 'none',
                    padding: '2px 0', transition: 'border-color 0.2s',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {['Heute', '3 Tage', 'Diese Woche', 'Kein Reminder'].map(opt => (
                <button key={opt} onClick={() => setDuration(duration === opt ? null : opt)} style={{
                  padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                  fontSize: '0.75rem', fontFamily: 'inherit',
                  fontWeight: duration === opt ? 500 : 400,
                  border: `1.5px solid ${duration === opt ? GOLD : 'var(--border)'}`,
                  background: duration === opt ? 'rgba(200,168,75,0.08)' : 'transparent',
                  color: duration === opt ? GOLD : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}>{opt}</button>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={!wennText || !dannText}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 9, border: 'none',
                background: wennText && dannText ? GOLD : 'var(--bg-subtle)',
                color: wennText && dannText ? '#fff' : 'var(--text-muted)',
                fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit',
                cursor: wennText && dannText ? 'pointer' : 'default',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              Intention speichern
            </button>
          </div>
        )}

        {saved && (
          <div style={{
            position: 'relative', marginBottom: 22,
            animation: 'mirrorFade 0.4s ease forwards',
          }}>
            {markerNode('saved', 99, 'var(--hint-ok)')}
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-display), Georgia, serif',
              fontSize: '0.9375rem', fontStyle: 'italic',
              color: 'var(--hint-ok)',
            }}>
              Wenn {wennText}, dann {dannText}.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
