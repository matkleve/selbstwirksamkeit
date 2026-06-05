'use client'

import { ArrowDownAZ, ChevronDown, Filter } from 'lucide-react'
import { NavDropdown } from '@/components/NavDropdown'
import { cn } from '@/lib/cn'
import {
  MIRROR_HISTORY_FILTER_OPTIONS,
  MIRROR_HISTORY_SORT_OPTIONS,
  type MirrorHistoryFilter,
  type MirrorHistorySort,
} from '@/lib/mirror-history-view'

type MenuId = 'filter' | 'sort'

interface Props {
  filter: MirrorHistoryFilter
  sort: MirrorHistorySort
  onFilterChange: (v: MirrorHistoryFilter) => void
  onSortChange: (v: MirrorHistorySort) => void
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
  icon: typeof Filter
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

export function MirrorHistoryToolbar({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  summary,
  openMenu,
  onOpenMenu,
}: Props) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-2">
      <ToolbarDropdown
        menuId="filter"
        openMenu={openMenu}
        onOpenMenu={onOpenMenu}
        icon={Filter}
        label="Filter"
        valueLabel={MIRROR_HISTORY_FILTER_OPTIONS.find(o => o.id === filter)?.label ?? 'Alle'}
        options={MIRROR_HISTORY_FILTER_OPTIONS}
        value={filter}
        onChange={onFilterChange}
      />
      <ToolbarDropdown
        menuId="sort"
        openMenu={openMenu}
        onOpenMenu={onOpenMenu}
        icon={ArrowDownAZ}
        label="Sortierung"
        valueLabel={MIRROR_HISTORY_SORT_OPTIONS.find(o => o.id === sort)?.label ?? 'Neueste'}
        options={MIRROR_HISTORY_SORT_OPTIONS}
        value={sort}
        onChange={onSortChange}
      />

      <p className="min-w-0 flex-1 basis-full text-xs text-ink-3 sm:basis-auto sm:text-right">
        {summary}
      </p>
    </div>
  )
}
