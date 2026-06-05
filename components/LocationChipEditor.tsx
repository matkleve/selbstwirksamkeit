'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { DropdownPanel, type DropdownMenuItem } from '@/components/DropdownPanel'
import { chipField } from '@/lib/chip-classes'

interface Props {
  value: string
  onChange: (v: string) => void
  onAdd: (v: string) => void
  onClose: () => void
  suggestions: string[]
  existingValues: string[]
}

async function searchNominatim(query: string): Promise<string[]> {
  if (!query.trim()) return []
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&accept-language=de`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const data = await res.json() as { display_name: string }[]
    return data.map(r => r.display_name.split(',')[0]!.trim()).filter(Boolean)
  } catch {
    return []
  }
}

export function LocationChipEditor({ value, onChange, onAdd, onClose, suggestions, existingValues }: Props) {
  const [internetResults, setInternetResults] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const existingLower = useMemo(() => existingValues.map(v => v.toLowerCase()), [existingValues])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setInternetResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchNominatim(value)
      setInternetResults(results.filter(r => !existingLower.includes(r.toLowerCase())))
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, existingLower])

  const q = value.trim().toLowerCase()
  const recentFiltered = (q
    ? suggestions.filter(s => s.toLowerCase().includes(q))
    : suggestions
  ).filter(s => !existingLower.includes(s.toLowerCase())).slice(0, 3)

  const items: DropdownMenuItem[] = []

  if (recentFiltered.length) {
    items.push({ type: 'header', id: 'h-recent', label: 'Zuletzt' })
    for (const name of recentFiltered) {
      items.push({ type: 'item', id: `r-${name}`, label: name, icon: MapPin, onClick: () => onAdd(name) })
    }
  }

  if (internetResults.length) {
    items.push({ type: 'header', id: 'h-internet', label: 'Internet' })
    for (const name of internetResults) {
      items.push({ type: 'item', id: `i-${name}`, label: name, icon: MapPin, onClick: () => onAdd(name) })
    }
  }

  return (
    <div className="relative inline-flex">
      <input
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value.slice(0, 40))}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (value.trim()) onAdd(value.trim())
            else onClose()
          }
          if (e.key === 'Escape') { e.preventDefault(); onClose() }
        }}
        placeholder="z.B. Büro"
        className={chipField}
      />
      {items.length > 0 && (
        <div onMouseDown={e => e.preventDefault()}>
          <DropdownPanel role="listbox" items={items} minWidth={180} listMaxHeight={160} />
        </div>
      )}
    </div>
  )
}
