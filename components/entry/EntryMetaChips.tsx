'use client'

import type { ReactNode } from 'react'
import { MapPin, User, Zap, Activity } from 'lucide-react'
import type { EntryMetaGroup, EntryMetaKind } from '@/lib/entryMeta'
import { isMetaRelevant } from '@/lib/entryMeta'
import { chipFilled } from '@/lib/chip-classes'
import { cn } from '@/lib/cn'
import { EntryMetaPopover } from '@/components/entry/EntryMetaPopover'

const META_CONFIG: Record<
  EntryMetaKind,
  { icon: typeof User; label: string }
> = {
  person: { icon: User, label: 'Personen' },
  location: { icon: MapPin, label: 'Orte' },
  activity: { icon: Zap, label: 'Tätigkeiten' },
  body: { icon: Activity, label: 'Zustand' },
}

interface Props {
  groups: EntryMetaGroup[]
  mode: 'open' | 'closed' | 'selective'
  relevantValues?: string[]
  size?: 'sm' | 'md'
  className?: string
  /** Mirror reveal: show first N chip units (open chips + popovers). */
  visibleUnitCount?: number
}

export function EntryMetaChips({ groups, mode, relevantValues, size = 'sm', className, visibleUnitCount }: Props) {
  if (!groups.length) return null

  const limit = visibleUnitCount ?? Number.POSITIVE_INFINITY

  const wrapUnit = (node: ReactNode, key: string, index: number) =>
    index < limit ? (
      <span key={key} className="mirror-word-fade inline-flex">
        {node}
      </span>
    ) : null

  if (mode === 'selective' && relevantValues?.length) {
    let unitIndex = 0
    return (
      <div className={cn('flex flex-wrap items-center gap-1.5 overflow-visible', className)}>
        {groups.flatMap(g => {
          const { icon, label } = META_CONFIG[g.kind]
          const open = g.values.filter(v => isMetaRelevant(v, relevantValues))
          const closed = g.values.filter(v => !isMetaRelevant(v, relevantValues))
          const nodes: ReactNode[] = []
          for (const [i, value] of open.entries()) {
            const Icon = META_CONFIG[g.kind].icon
            const idx = unitIndex++
            nodes.push(
              wrapUnit(
                <span className={cn(chipFilled, size === 'sm' && 'h-6 min-h-6 max-h-6 px-2 text-xs')}>
                  <Icon size={size === 'sm' ? 13 : 15} strokeWidth={1.75} aria-hidden />
                  <span>{value}</span>
                </span>,
                `${g.kind}-open-${i}`,
                idx,
              ),
            )
          }
          if (closed.length) {
            const idx = unitIndex++
            nodes.push(
              wrapUnit(
                <EntryMetaPopover
                  icon={icon}
                  label={label}
                  count={closed.length}
                  items={closed}
                  size={size}
                />,
                `${g.kind}-closed`,
                idx,
              ),
            )
          }
          return nodes
        })}
      </div>
    )
  }

  if (mode === 'closed') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1.5 overflow-visible', className)}>
        {groups.map((g, gi) => {
          const { icon, label } = META_CONFIG[g.kind]
          return wrapUnit(
            <EntryMetaPopover
              icon={icon}
              label={label}
              count={g.values.length}
              items={g.values}
              size={size}
            />,
            g.kind,
            gi,
          )
        })}
      </div>
    )
  }

  let unitIndex = 0
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {groups.flatMap(g => {
        const { icon: Icon } = META_CONFIG[g.kind]
        return g.values.map((value, i) => {
          const idx = unitIndex++
          return wrapUnit(
            <span className={cn(chipFilled, size === 'sm' && 'h-6 min-h-6 max-h-6 px-2 text-xs')}>
              <Icon size={size === 'sm' ? 13 : 15} strokeWidth={1.75} aria-hidden />
              <span>{value}</span>
            </span>,
            `${g.kind}-${i}`,
            idx,
          )
        })
      })}
    </div>
  )
}
