'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { MIRROR_REMINDER_OPTIONS, pickMirrorReminderIntro } from '@/components/mirror/MirrorFlow.constants'

export function MirrorReminderChips({
  duration,
  setDuration,
}: {
  duration: string | null
  setDuration: (v: string | null) => void
}) {
  const intro = useMemo(() => pickMirrorReminderIntro(), [])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm italic text-muted-foreground">{intro}</p>
      <div className="flex flex-wrap gap-1.5">
        {MIRROR_REMINDER_OPTIONS.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => setDuration(duration === opt ? null : opt)}
            className="cursor-pointer rounded-chip border-0 bg-transparent p-0"
          >
            <Badge variant={duration === opt ? 'filled' : 'default'}>{opt}</Badge>
          </button>
        ))}
      </div>
    </div>
  )
}
