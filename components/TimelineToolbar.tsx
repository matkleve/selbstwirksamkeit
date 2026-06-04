'use client'

import { useRef } from 'react'
import { ArrowDownAZ, ChevronDown, Filter, LayoutList } from 'lucide-react'
import { DropdownPanel, useClickOutside } from '@/components/DropdownPanel'
import { cn } from '@/lib/cn'
import {
  TIMELINE_DENSITY_OPTIONS,
  TIMELINE_FILTER_OPTIONS,
  TIMELINE_SORT_OPTIONS,
  type TimelineDensity,
  type TimelineFilter,
  type TimelineSort,
} from '@/lib/timelineView'

type MenuId = 'density' | 'filter' | 'sort'

interface Props {
  density: TimelineDensity
  filter: TimelineFilter
  sort: TimelineSort
  onDensityChange: (v: TimelineDensity) => void
  onFilterChange: (v: TimelineFilter) => void
  onSortChange: (v: TimelineSort) => void
  summary: string
  openMenu: MenuId | null
  onOpenMenu: (id: MenuId | null) => void
}

function ToolbarDropdown<T extends string>({
  menuId,
  openMenu,
  onOpenMenu,
  icon: Icon,
  label,
  valueLabel,
  options,
  value,
  onChange,
}: {
  menuId: MenuId
  openMenu: MenuId | null
  onOpenMenu: (id: MenuId | null) => void
  icon: typeof LayoutList
  label: string
  valueLabel: string
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const open = openMenu === menuId

  useClickOutside(ref, () => onOpenMenu(null), open)

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => onOpenMenu(open ? null : menuId)}
        className={cn(
          'nav-interactive nav-interactive--ink flex h-8 items-center gap-1.5 rounded-lg border border-edge px-2.5 text-xs',
          open && 'border-[var(--border-focus)] bg-subtle',
        )}
      >
        <Icon size={14} strokeWidth={1.75} aria-hidden className="shrink-0 text-ink-3" />
        <span className="hidden text-ink-3 sm:inline">{label}</span>
        <span className="font-medium text-ink">{valueLabel}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          aria-hidden
          className={cn('shrink-0 text-ink-3 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <DropdownPanel
          role="listbox"
          minWidth={168}
          items={options.map(o => ({
            type: 'item' as const,
            id: o.id,
            label: o.id === value ? `✓ ${o.label}` : o.label,
            onClick: () => {
              onChange(o.id)
              onOpenMenu(null)
            },
          }))}
        />
      )}
    </div>
  )
}

export function TimelineToolbar({
  density,
  filter,
  sort,
  onDensityChange,
  onFilterChange,
  onSortChange,
  summary,
  openMenu,
  onOpenMenu,
}: Props) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <ToolbarDropdown
          menuId="density"
          openMenu={openMenu}
          onOpenMenu={onOpenMenu}
          icon={LayoutList}
          label="Größe"
          valueLabel={TIMELINE_DENSITY_OPTIONS.find(o => o.id === density)?.label ?? 'Text'}
          options={TIMELINE_DENSITY_OPTIONS}
          value={density}
          onChange={onDensityChange}
        />
        <ToolbarDropdown
          menuId="filter"
          openMenu={openMenu}
          onOpenMenu={onOpenMenu}
          icon={Filter}
          label="Filter"
          valueLabel={TIMELINE_FILTER_OPTIONS.find(o => o.id === filter)?.label ?? 'Alle'}
          options={TIMELINE_FILTER_OPTIONS}
          value={filter}
          onChange={onFilterChange}
        />
        <ToolbarDropdown
          menuId="sort"
          openMenu={openMenu}
          onOpenMenu={onOpenMenu}
          icon={ArrowDownAZ}
          label="Sortierung"
          valueLabel={TIMELINE_SORT_OPTIONS.find(o => o.id === sort)?.label ?? 'Neueste'}
          options={TIMELINE_SORT_OPTIONS}
          value={sort}
          onChange={onSortChange}
        />

      <p className="min-w-0 flex-1 basis-full text-xs text-ink-3 sm:basis-auto sm:text-right">
        {summary}
      </p>
    </div>
  )
}
