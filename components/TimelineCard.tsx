'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Entry } from '@/lib/types'
import { getQuadrant, getValenceColor } from '@/lib/types'
import { getBodyStateHint } from '@/lib/utils'
import { quadrantTexts } from '@/lib/quadrantTexts'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import BodyStateHint from './BodyStateHint'
import { EntryDisplay } from '@/components/entry'

interface TimelineCardProps {
  entry: Entry
}

export default function TimelineCard({ entry }: TimelineCardProps) {
  const [showReframe, setShowReframe] = useState(false)
  const [reframeText, setReframeText] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

  const handleReframeSave = async () => {
    if (!reframeText.trim()) return
    setSaving(true)
    await supabase.from('entries').update({ reframe: reframeText.trim() }).eq('id', entry.id)
    setSaving(false)
    setShowReframe(false)
    router.refresh()
  }

  const handleDelete = async () => {
    await supabase.from('entries').delete().eq('id', entry.id)
    router.refresh()
  }

  const tintBg = `color-mix(in srgb, ${getValenceColor(entry.grid_x)} 6%, var(--bg-card))`

  return (
    <div
      className="overflow-hidden rounded-card border border-edge shadow-card"
      style={{ background: tintBg }}
    >
      <div className="p-4 md:p-[18px]">
        <EntryDisplay entry={entry} variant="full" size="md" lines="none" showDate>
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

        {entry.grid_x !== null && entry.grid_x < 0 && !entry.reframe && !showReframe && (
          <Button variant="link" size="sm" className="mt-2" onClick={() => setShowReframe(true)}>
            → Wie siehst du das heute?
          </Button>
        )}

        {showReframe && (
          <div className="mt-3 border-t border-edge pt-3">
            <Textarea
              value={reframeText}
              onChange={e => setReframeText(e.target.value)}
              rows={2}
              placeholder="Wie siehst du das heute?"
              className="mb-2"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReframe(false)}>
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={handleReframeSave}
                disabled={!reframeText.trim() || saving}
              >
                {saving ? 'Speichern…' : 'Speichern'}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-end">
          <Button variant="link" size="sm" onClick={handleDelete}>
            löschen
          </Button>
        </div>
      </div>
    </div>
  )
}
