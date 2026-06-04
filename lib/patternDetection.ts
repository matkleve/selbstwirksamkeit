import type { Entry } from './types'

export interface EntrySnapshot {
  id: string
  text: string
  created_at: string
  grid_x: number | null
  body_state: string | null
}

export type PatternBlock =
  | { type: 'text'; text: string; italic?: boolean; muted?: boolean }
  | { type: 'entry'; entry: EntrySnapshot; chips?: string[] }

export type PatternType =
  | 'late_night'
  | 'mastery_streak'
  | 'body_fatigue'
  | 'no_pattern'
  | 'insufficient_data'

export interface PatternResult {
  found: boolean
  patternType: PatternType
  signalStrength: 'weak' | 'moderate' | 'strong' | null
  blocks: PatternBlock[]
  question: string | null
  diagramType: 'timeline' | 'daytime' | null
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function entryChips(e: Entry): string[] {
  const chips: string[] = []
  if (e.body_state === 'tired') chips.push('müde')
  else if (e.body_state === 'stressed') chips.push('gestresst')
  if (e.grid_x !== null && e.grid_x <= -3) chips.push('schwer')
  return chips
}

export function detectPattern(entries: Entry[]): PatternResult {
  if (entries.length < 5) {
    return {
      found: false, patternType: 'insufficient_data', signalStrength: null,
      blocks: [
        { type: 'text', text: 'Ich hab mir deine Einträge angeschaut.' },
        { type: 'text', text: 'Noch zu wenige Einträge für ein klares Muster. Aber du hast angefangen — das zählt.', muted: true },
      ],
      question: null, diagramType: null,
    }
  }

  // ── Late-night fatigue ──
  const lateNeg = entries.filter(e => {
    const h = new Date(e.created_at).getHours()
    return (h >= 22 || h <= 2) && e.grid_x !== null && e.grid_x < -0.5
  })

  if (lateNeg.length >= 3) {
    const shown = lateNeg.slice(-3)
    const earlyPos = entries
      .filter(e => {
        const h = new Date(e.created_at).getHours()
        return h >= 19 && h <= 22 && (e.grid_x ?? 0) >= 2
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    const blocks: PatternBlock[] = [
      { type: 'text', text: 'Ich hab mir die letzten Wochen angeschaut. Mir ist etwas aufgefallen.' },
      ...shown.map(e => ({ type: 'entry' as const, entry: e, chips: entryChips(e) })),
    ]
    if (earlyPos) {
      blocks.push({
        type: 'text',
        text: `Aber am ${fmtDate(earlyPos.created_at)} hast du geschrieben: "${earlyPos.text.slice(0, 80)}".`,
      })
    }
    return {
      found: true, patternType: 'late_night',
      signalStrength: lateNeg.length >= 5 ? 'strong' : 'moderate',
      blocks, question: 'Warum glaubst du, hast du das immer wieder geschrieben?',
      diagramType: 'daytime',
    }
  }

  // ── Mastery streak ──
  const sortedDays = [...new Set(entries.map(e => e.created_at.slice(0, 10)))].sort((a, b) => b.localeCompare(a))
  const now = new Date()
  let streak = 0
  for (let i = 0; i < sortedDays.length; i++) {
    const d = new Date(sortedDays[i] + 'T12:00:00')
    const exp = new Date(now); exp.setDate(now.getDate() - i)
    if (d.toDateString() === exp.toDateString()) streak++
    else break
  }
  if (streak >= 4) {
    const posEntries = entries
      .filter(e => e.grid_x !== null && e.grid_x >= 2)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
    return {
      found: true, patternType: 'mastery_streak',
      signalStrength: streak >= 7 ? 'strong' : 'moderate',
      blocks: [
        { type: 'text', text: `${streak} Tage am Stück. Ich hab mir angeschaut, was du in dieser Zeit geschrieben hast.` },
        ...posEntries.map(e => ({ type: 'entry' as const, entry: e, chips: [] })),
      ],
      question: 'Was war in diesen Momenten anders als sonst?',
      diagramType: 'timeline',
    }
  }

  // ── Body-state correlation ──
  const tired = entries.filter(e => e.body_state === 'tired' && e.grid_x !== null)
  const calm  = entries.filter(e => e.body_state === 'calm'  && e.grid_x !== null)
  if (tired.length >= 3 && calm.length >= 2) {
    const avgTired = tired.reduce((s, e) => s + (e.grid_x ?? 0), 0) / tired.length
    const avgCalm  = calm.reduce((s, e) => s + (e.grid_x ?? 0), 0) / calm.length
    if (avgCalm - avgTired >= 2) {
      return {
        found: true, patternType: 'body_fatigue', signalStrength: 'moderate',
        blocks: [
          { type: 'text', text: 'Wenn du müde bist, schreibst du anders als wenn du ruhig bist. Ich hab das verglichen.' },
          ...tired.slice(-2).map(e => ({ type: 'entry' as const, entry: e, chips: ['müde'] })),
          ...calm.slice(-1).map(e => ({ type: 'entry' as const, entry: e, chips: ['ruhig'] })),
        ],
        question: 'Was brauchst du, um öfter aus dem ruhigen Zustand zu schreiben?',
        diagramType: null,
      }
    }
  }

  return {
    found: false, patternType: 'no_pattern', signalStrength: null,
    blocks: [
      { type: 'text', text: 'Ich hab mir die letzten Wochen angeschaut.' },
      { type: 'text', text: 'Gerade sehe ich nichts Klares. Das ist völlig okay — nicht jede Phase hat ein Muster.', muted: true },
    ],
    question: null, diagramType: null,
  }
}
