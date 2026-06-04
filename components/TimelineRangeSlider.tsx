'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { Entry } from '@/lib/types'
import { gridColorRgb } from '@/lib/gridColors'
import { cn } from '@/lib/cn'
import {
  dateToRatio,
  formatRangeLabel,
  formatSliderEndLabel,
  groupEntriesByDayKeys,
  normalizeRange,
  rangeAroundDate,
  ratioToDate,
  type TimelineDateRange,
} from '@/lib/timelineRange'

interface Props {
  entries: Entry[]
  bounds: TimelineDateRange
  range: TimelineDateRange
  onRangeChange: (range: TimelineDateRange) => void
  className?: string
}

/** Padding inside the strip (outer shell). */
const TRACK_PAD_CLASS = 'px-3 py-2.5'

function ratioLeft(ratio: number): string {
  return `${ratio * 100}%`
}

function ratioWidth(startRatio: number, endRatio: number): string {
  return `${Math.max(0.4, (endRatio - startRatio) * 100)}%`
}

function clientXToRatio(clientX: number, rect: DOMRect): number {
  if (rect.width <= 0) return 0.5
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
}

export function TimelineRangeSlider({
  entries,
  bounds,
  range,
  onRangeChange,
  className,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ anchorDate: string; moved: boolean; startX: number } | null>(null)

  const [dragPreview, setDragPreview] = useState<TimelineDateRange | null>(null)
  const displayRange = dragPreview ?? range

  const byDay = useMemo(() => groupEntriesByDayKeys(entries), [entries])

  const dayMarkers = useMemo(() => {
    return [...byDay.entries()].map(([date, dayEntries]) => {
      const withX = dayEntries.filter(e => e.grid_x !== null)
      if (!withX.length) {
        return { date, ratio: dateToRatio(date, bounds), color: 'var(--text-muted)', count: dayEntries.length }
      }
      const withY = dayEntries.filter(e => e.grid_y !== null)
      const avgX = withX.reduce((s, e) => s + (e.grid_x ?? 0), 0) / withX.length
      const avgY = withY.length
        ? withY.reduce((s, e) => s + (e.grid_y ?? 0), 0) / withY.length
        : 0
      return {
        date,
        ratio: dateToRatio(date, bounds),
        color: gridColorRgb(avgX, avgY),
        count: dayEntries.length,
      }
    })
  }, [byDay, bounds])

  const clientXToDate = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return bounds.start
      const ratio = clientXToRatio(clientX, el.getBoundingClientRect())
      return ratioToDate(ratio, bounds)
    },
    [bounds],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const date = clientXToDate(e.clientX)
    dragRef.current = { anchorDate: date, moved: false, startX: e.clientX }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    if (!drag.moved && Math.abs(e.clientX - drag.startX) < 4) return
    drag.moved = true
    const date = clientXToDate(e.clientX)
    setDragPreview(normalizeRange(drag.anchorDate, date))
  }

  const finishPointer = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    setDragPreview(null)

    if (!drag.moved) {
      onRangeChange(rangeAroundDate(drag.anchorDate, bounds))
    } else {
      const date = clientXToDate(e.clientX)
      onRangeChange(normalizeRange(drag.anchorDate, date))
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }

  const onPointerUp = (e: React.PointerEvent) => finishPointer(e)
  const onPointerCancel = () => {
    dragRef.current = null
    setDragPreview(null)
  }

  const selStart = dateToRatio(displayRange.start, bounds)
  const selEnd = dateToRatio(displayRange.end, bounds)

  const startLabel = new Date(bounds.start + 'T12:00:00').toLocaleDateString('de-DE', {
    month: 'short',
    year: '2-digit',
  })
  const endLabel = formatSliderEndLabel(bounds.end)

  return (
    <div className={cn('select-none', className)}>
      <div
        role="group"
        aria-label="Zeitraum wählen"
        className={cn('rounded-lg border border-edge bg-subtle', TRACK_PAD_CLASS)}
      >
        <div
          ref={trackRef}
          className="relative h-8 cursor-crosshair touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-edge" />

          {dayMarkers.map(({ date, ratio, color, count }) => (
            <span
              key={date}
              className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[2px]"
              style={{
                left: ratioLeft(ratio),
                width: count > 1 ? 7 : 5,
                height: count > 1 ? 10 : 6,
                background: color,
                opacity: 0.85,
              }}
              title={`${date} (${count})`}
            />
          ))}

          <div
            className="pointer-events-none absolute inset-y-0 rounded-md border border-[var(--border-focus)] bg-[color-mix(in_srgb,var(--nav-active-bg)_55%,transparent)]"
            style={{ left: ratioLeft(selStart), width: ratioWidth(selStart, selEnd) }}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-ink-3">
        <span>{startLabel}</span>
        <span className="text-center text-xs font-medium text-ink-2">
          {formatRangeLabel(displayRange)}
        </span>
        <span>{endLabel}</span>
      </div>
    </div>
  )
}
