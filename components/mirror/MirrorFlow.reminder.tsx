'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { MIRROR_REMINDER_OPTIONS, pickMirrorReminderIntro } from '@/components/mirror/MirrorFlow.constants'

export function MirrorReminderChips({
  onSelect,
}: {
  onSelect: (label: (typeof MIRROR_REMINDER_OPTIONS)[number]['label']) => void
}) {
  const intro = useMemo(() => pickMirrorReminderIntro(), [])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm italic text-muted-foreground">{intro}</p>
      <div className="flex flex-wrap gap-1.5">
        {MIRROR_REMINDER_OPTIONS.map(opt => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onSelect(opt.label)}
            className="cursor-pointer rounded-chip border-0 bg-transparent p-0"
          >
            <Badge variant="default">{opt.label}</Badge>
          </button>
        ))}
      </div>
    </div>
  )
}
