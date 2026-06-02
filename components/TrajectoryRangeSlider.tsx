'use client'

import { useCallback, useRef } from 'react'
import { cn } from '@/lib/cn'
import { formatRangeLabel, sliderToTime } from '@/lib/trajectoryTime'

interface Props {
  minT: number
  maxT: number
  start: number
  end: number
  onChange: (start: number, end: number) => void
}

export default function TrajectoryRangeSlider({ minT, maxT, start, end, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  const pickThumb = useCallback(
    (clientX: number, which: 'start' | 'end') => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))

      if (which === 'start') {
        onChange(Math.min(ratio, end - 0.02), end)
      } else {
        onChange(start, Math.max(ratio, start + 0.02))
      }
    },
    [start, end, onChange],
  )

  const onPointerDown = (which: 'start' | 'end') => (e: React.PointerEvent) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const move = (ev: PointerEvent) => pickThumb(ev.clientX, which)
    const up = () => {
      target.releasePointerCapture(e.pointerId)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    pickThumb(e.clientX, which)
  }

  const rangeStartMs = sliderToTime(start, minT, maxT)
  const rangeEndMs = sliderToTime(end, minT, maxT)

  return (
    <div className="mb-4">
      <div className="mb-2 flex justify-between text-[0.625rem] text-ink-3">
        <span>{formatRangeLabel(minT)}</span>
        <span className="text-ink-2">{formatRangeLabel(rangeStartMs)} – {formatRangeLabel(rangeEndMs)}</span>
        <span>heute</span>
      </div>

      <div
        ref={trackRef}
        className="relative mx-2 h-7 touch-none select-none"
        role="group"
        aria-label="Zeitfenster"
      >
        <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-subtle" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink/25"
          style={{ left: `${start * 100}%`, right: `${(1 - end) * 100}%` }}
        />

        {(['start', 'end'] as const).map(which => {
          const t = which === 'start' ? start : end
          return (
            <button
              key={which}
              type="button"
              aria-label={which === 'start' ? 'Beginn des Zeitfensters' : 'Ende des Zeitfensters (heute)'}
              onPointerDown={onPointerDown(which)}
              className={cn(
                'absolute top-1/2 z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full',
                'border-2 border-card bg-ink shadow-sm',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
              style={{ left: `${t * 100}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}
