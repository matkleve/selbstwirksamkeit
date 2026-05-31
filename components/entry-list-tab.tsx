'use client'

import { useState } from 'react'
import { timeAgo } from '@/lib/utils'
import type { Entry, Category } from '@/lib/types'
import { CategoryPills } from '@/components/category-pills'

const ALL_CATEGORIES: Category[] = [
  'allgemein', 'studium', 'arbeit / bewerbung', 'projekt', 'persönlich',
]

function filterBtnClass(active: boolean) {
  return active
    ? 'text-xs px-3 py-1 rounded-full cursor-pointer font-inherit border border-accent text-accent bg-accent-light'
    : 'text-xs px-3 py-1 rounded-full cursor-pointer font-inherit border border-border text-muted bg-transparent'
}

export function EntryListTab({
  entries,
  onDelete,
}: {
  entries: Entry[]
  onDelete: (id: string) => void
}) {
  const [activeFilter, setActiveFilter] = useState<Category | null>(null)

  const usedCategories = ALL_CATEGORIES.filter(cat =>
    entries.some(e => e.categories?.includes(cat))
  )
  const filtered = activeFilter
    ? entries.filter(e => e.categories?.includes(activeFilter))
    : entries

  if (entries.length === 0) {
    return <p className="text-muted text-sm text-center py-8">Noch keine Einträge.</p>
  }

  return (
    <>
      {usedCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={filterBtnClass(activeFilter === null)}
          >
            Alle
          </button>
          {usedCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
              className={filterBtnClass(activeFilter === cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">Keine Einträge in dieser Kategorie.</p>
      ) : (
        filtered.map(e => (
          <div
            key={e.id}
            className="border-l-2 border-accent bg-surface py-3.5 px-4 mb-3 rounded-l-none rounded-r-lg"
          >
            <p className="text-[15px] leading-relaxed mb-1.5">{e.text}</p>
            <div className="text-xs text-muted flex flex-wrap items-center gap-2">
              <span className="text-accent">{timeAgo(e.created_at)}</span>
              <span>·</span>
              <CategoryPills categories={e.categories ?? []} />
              <span>·</span>
              <button
                type="button"
                onClick={() => onDelete(e.id)}
                className="text-xs text-muted-light bg-transparent border-0 cursor-pointer p-0 underline"
              >
                löschen
              </button>
            </div>
          </div>
        ))
      )}
    </>
  )
}
