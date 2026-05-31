'use client'

import { useState } from 'react'
import type { Category } from '@/lib/types'

const CATEGORIES: Category[] = [
  'allgemein', 'studium', 'arbeit / bewerbung', 'projekt', 'persönlich',
]

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2.5 text-[15px] font-inherit outline-none bg-surface text-foreground'
const cardClass = 'bg-card border border-border rounded-xl p-5 mb-4'
const labelClass = 'text-[11px] text-muted uppercase tracking-wider mb-2.5'
const primaryBtnClass =
  'bg-primary text-primary-fg border-0 rounded-lg px-[18px] py-2 text-sm cursor-pointer font-inherit disabled:opacity-45 disabled:cursor-not-allowed'
const ghostBtnClass =
  'bg-transparent text-muted border border-border rounded-lg px-[18px] py-2 text-sm cursor-pointer font-inherit'

function tagBtnClass(selected: boolean) {
  return selected
    ? 'text-xs px-3 py-1 rounded-full cursor-pointer font-inherit border border-accent text-accent bg-accent-light'
    : 'text-xs px-3 py-1 rounded-full cursor-pointer font-inherit border border-border text-muted bg-transparent'
}

export function AddEntryTab({ onAdd }: { onAdd: (text: string, categories: Category[]) => Promise<void> }) {
  const [text, setText] = useState('')
  const [categories, setCategories] = useState<Category[]>(['allgemein'])

  function toggleCategory(cat: Category) {
    setCategories(prev => {
      if (prev.includes(cat)) {
        const next = prev.filter(c => c !== cat)
        return next.length > 0 ? next : prev
      }
      return [...prev, cat]
    })
  }

  async function handleAdd() {
    if (!text.trim()) return
    await onAdd(text.trim(), categories)
    setText('')
    setCategories(['allgemein'])
  }

  return (
    <div className={cardClass}>
      <div className={labelClass}>Was habe ich heute geschafft?</div>
      <p className="text-[11px] text-muted mb-1.5">Tags (mehrere möglich)</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {CATEGORIES.map(cat => (
          <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={tagBtnClass(categories.includes(cat))}>
            {cat}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="z.B. Mathe-Test gemacht, obwohl ich keine Lust hatte…"
        rows={3}
        className={`${inputClass} resize-none`}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() }
        }}
      />
      <div className="flex justify-between gap-2 mt-2.5">
        <button type="button" onClick={() => setText('')} className={ghostBtnClass}>Löschen</button>
        <button type="button" onClick={handleAdd} className={primaryBtnClass}>+ Eintragen</button>
      </div>
      <p className="hidden sm:block text-[11px] text-muted-light mt-2">Enter zum Speichern · Shift+Enter für neue Zeile</p>
    </div>
  )
}
