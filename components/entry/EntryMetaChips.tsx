'use client'

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
}

export function EntryMetaChips({ groups, mode, relevantValues, size = 'sm', className }: Props) {
  if (!groups.length) return null

  if (mode === 'selective' && relevantValues?.length) {
    return (
      <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
        {groups.flatMap(g => {
          const { icon, label } = META_CONFIG[g.kind]
          const open = g.values.filter(v => isMetaRelevant(v, relevantValues))
          const closed = g.values.filter(v => !isMetaRelevant(v, relevantValues))
          const nodes = open.map((value, i) => {
            const Icon = META_CONFIG[g.kind].icon
            return (
              <span
                key={`${g.kind}-open-${i}`}
                className={cn(chipFilled, size === 'sm' && 'h-6 min-h-6 max-h-6 px-2 text-xs')}
              >
                <Icon size={size === 'sm' ? 13 : 15} strokeWidth={1.75} aria-hidden />
                <span>{value}</span>
              </span>
            )
          })
          if (closed.length) {
            nodes.push(
              <EntryMetaPopover
                key={`${g.kind}-closed`}
                icon={icon}
                label={label}
                count={closed.length}
                items={closed}
                size={size}
              />,
            )
          }
          return nodes
        })}
      </div>
    )
  }

  if (mode === 'closed') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
        {groups.map(g => {
          const { icon, label } = META_CONFIG[g.kind]
          return (
            <EntryMetaPopover
              key={g.kind}
              icon={icon}
              label={label}
              count={g.values.length}
              items={g.values}
              size={size}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {groups.flatMap(g => {
        const { icon: Icon } = META_CONFIG[g.kind]
        return g.values.map((value, i) => (
          <span key={`${g.kind}-${i}`} className={cn(chipFilled, size === 'sm' && 'h-6 min-h-6 max-h-6 px-2 text-xs')}>
            <Icon size={size === 'sm' ? 13 : 15} strokeWidth={1.75} aria-hidden />
            <span>{value}</span>
          </span>
        ))
      })}
    </div>
  )
}
