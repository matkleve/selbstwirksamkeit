'use client'

import { ArrowLeftRight, Bell, Circle, Pencil, Quote } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

const SPINE_GRID = 'grid grid-cols-[2.5rem_minmax(0,1fr)]'

function MarkerIcon({ type, idx }: { type: string; idx: number }) {
  const iconClass = 'size-2.5 shrink-0 stroke-[2.25]'
  switch (type) {
    case 'entry':
      return <Quote className={iconClass} aria-hidden />
    case 'transition':
      return <ArrowLeftRight className={iconClass} aria-hidden />
    case 'question':
      return <span className="text-[0.625rem] font-semibold leading-none">?</span>
    case 'reflection':
    case 'intention':
      return <Pencil className={iconClass} aria-hidden />
    case 'reminder':
      return <Bell className={iconClass} aria-hidden />
    case 'summary':
      return <Circle className="size-1.5 fill-current stroke-none" aria-hidden />
    default:
      return (
        <Circle className={cn('fill-current stroke-none', idx === 0 ? 'size-1' : 'size-1')} aria-hidden />
      )
  }
}

function SpineMarker({ type, idx }: { type: string; idx: number }) {
  return (
    <div
      className="relative z-[2] flex size-5 shrink-0 items-center justify-center rounded-full border border-edge bg-canvas text-ink-2"
      aria-hidden
    >
      <MarkerIcon type={type} idx={idx} />
    </div>
  )
}

export function MirrorTimelineRow({
  markerType,
  markerIdx,
  className,
  children,
}: {
  markerType: string
  markerIdx: number
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn(className)}>
      <div className={SPINE_GRID}>
        <div className="flex justify-center self-start pt-0.5">
          <SpineMarker type={markerType} idx={markerIdx} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
