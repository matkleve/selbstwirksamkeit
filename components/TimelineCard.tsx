'use client'

import type { Entry } from '@/lib/types'
import { getQuadrant } from '@/lib/types'
import { EntryCardShell } from '@/components/entry/EntryCardShell'
import { getBodyStateHint } from '@/lib/utils'
import { quadrantTexts } from '@/lib/quadrantTexts'
import BodyStateHint from './BodyStateHint'
import { EntryDisplay } from '@/components/entry'

interface TimelineCardProps {
  entry: Entry
}

export default function TimelineCard({ entry }: TimelineCardProps) {
  const quadrant = getQuadrant(entry)
  const quadrantText = quadrant
    ? quadrantTexts[quadrant][entry.id.charCodeAt(0) % quadrantTexts[quadrant].length]
    : null

  const gridLabel = (() => {
    if (entry.grid_x === null) return null
    const sign = entry.grid_x > 0 ? '+' : ''
    const axis = entry.grid_y !== null ? (entry.grid_y >= 0 ? 'andere' : 'ich') : ''
    return `${sign}${entry.grid_x}${axis ? ` / ${axis}` : ''}`
  })()

  const bodyHint = entry.body_state ? getBodyStateHint(entry.body_state, entry.grid_x) : null

  return (
    <EntryCardShell entry={entry} padding="md">
      <EntryDisplay entry={entry} variant="full" size="md" lines="none" card={false} showDate>
        {gridLabel && (
          <p className="mb-1 text-xs text-ink-3">({gridLabel})</p>
        )}
        {quadrantText && (
          <p className="mb-2 text-sm italic text-ink-3">💭 {quadrantText}</p>
        )}
        {entry.reframe && (
          <div className="mb-2 rounded-lg bg-subtle px-3 py-2 text-sm text-ink-2">
            → {entry.reframe}
          </div>
        )}
        {bodyHint && <BodyStateHint hint={bodyHint} />}
      </EntryDisplay>
    </EntryCardShell>
  )
}
