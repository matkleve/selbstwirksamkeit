'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Entry } from '@/lib/types'
import { getValenceColor, getQuadrant } from '@/lib/types'
import { getBodyStateHint, timeAgo } from '@/lib/utils'
import { quadrantTexts } from '@/lib/quadrantTexts'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import BodyStateHint from './BodyStateHint'
import { MapPin, User, Zap } from 'lucide-react'

interface TimelineCardProps {
  entry: Entry
}

export default function TimelineCard({ entry }: TimelineCardProps) {
  const [showReframe, setShowReframe] = useState(false)
  const [reframeText, setReframeText] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const valenceColor = getValenceColor(entry.grid_x)
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

  const tintBg = `color-mix(in srgb, ${valenceColor} 6%, var(--bg-card))`

  return (
    <div style={{
      background: tintBg,
      borderRadius: 'var(--radius-card, 0.875rem)',
      boxShadow: 'var(--shadow-card)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      display: 'flex',
    }}>
      {/* Valence border */}
      <div style={{ width: 3, background: valenceColor, flexShrink: 0 }} />

      <div style={{ padding: '16px 18px', flex: 1, minWidth: 0 }}>
        {/* Text */}
        <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 8 }}>
          "{entry.text}"
        </p>

        {/* Grid position */}
        {gridLabel && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            ({gridLabel})
          </p>
        )}

        {/* Quadrant text */}
        {quadrantText && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>
            💭 {quadrantText}
          </p>
        )}

        {/* Reframe */}
        {entry.reframe && (
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-subtle)',
            borderRadius: 8,
            marginBottom: 8,
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}>
            → {entry.reframe}
          </div>
        )}

        {/* Body state hint */}
        {bodyHint && <BodyStateHint hint={bodyHint} />}

        {/* Meta chips */}
        <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
          {entry.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} strokeWidth={1.75} aria-hidden /> {entry.location}
            </span>
          )}
          {entry.person && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <User size={12} strokeWidth={1.75} aria-hidden /> {entry.person}
            </span>
          )}
          {entry.activity && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Zap size={12} strokeWidth={1.75} aria-hidden /> {entry.activity}
            </span>
          )}
          <span style={{ marginLeft: 'auto' }}>{timeAgo(entry.created_at)}</span>
        </div>

        {/* Reframe invite for negative entries without reframe */}
        {entry.grid_x !== null && entry.grid_x < 0 && !entry.reframe && !showReframe && (
          <Button variant="link" size="sm" onClick={() => setShowReframe(true)}>
            → Wie siehst du das heute?
          </Button>
        )}

        {/* Inline reframe input */}
        {showReframe && (
          <div style={{ marginTop: 10 }}>
            <Textarea
              value={reframeText}
              onChange={e => setReframeText(e.target.value)}
              rows={2}
              placeholder="Wie siehst du das heute?"
              className="mb-2"
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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

        {/* Delete */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="link" size="sm" onClick={handleDelete}>
            löschen
          </Button>
        </div>
      </div>
    </div>
  )
}
