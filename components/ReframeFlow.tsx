'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Entry } from '@/lib/types'

interface ReframeFlowProps {
  entry: Entry
  onDone: () => void
}

export default function ReframeFlow({ entry, onDone }: ReframeFlowProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    await supabase.from('entries').update({ reframe: text.trim() }).eq('id', entry.id)
    setSaving(false)
    onDone()
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
        ✓ Eingetragen.
      </p>
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 10, fontWeight: 500 }}>
        Wie könntest du das anders sehen?
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: '10px 12px', marginBottom: 10, resize: 'vertical' }}
        autoFocus
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onDone} className="btn-ghost">
          Überspringen
        </button>
        <button
          onClick={handleSave}
          disabled={!text.trim() || saving}
          className="btn-primary"
        >
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
