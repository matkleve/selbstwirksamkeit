'use client'

import { ArrowDownAZ, ChevronDown, Filter, LayoutList } from 'lucide-react'
import { NavDropdown } from '@/components/NavDropdown'
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
  const open = openMenu === menuId

  return (
    <NavDropdown
      role="listbox"
      minWidth={168}
      open={open}
      onOpenChange={next => onOpenMenu(next ? menuId : null)}
      items={options.map(o => ({
        type: 'item' as const,
        id: o.id,
        label: o.label,
        selected: o.id === value,
        onClick: () => onChange(o.id),
      }))}
    >
      {({ open: isOpen, toggle }) => (
        <button
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={toggle}
          data-active={isOpen ? '' : undefined}
          className="nav-interactive nav-interactive--ink flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-edge px-2.5 text-xs"
        >
          <Icon size={14} strokeWidth={1.75} aria-hidden className="shrink-0 text-ink-3" />
          <span className="hidden text-ink-3 sm:inline">{label}</span>
          <span className="font-medium text-ink">{valueLabel}</span>
          <ChevronDown
            size={14}
            strokeWidth={1.75}
            aria-hidden
            className={cn('shrink-0 text-ink-3 transition-transform', isOpen && 'rotate-180')}
          />
        </button>
      )}
    </NavDropdown>
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
