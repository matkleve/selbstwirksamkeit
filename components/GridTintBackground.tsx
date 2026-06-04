'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  gridTintAuroraDrift,
  gridTintAuroraMesh,
  gridTintShouldAnimate,
  type GridPosition,
  type GridTintPreset,
} from '@/lib/gridTint'

export interface GridTintBackgroundProps extends GridPosition {
  preset?: GridTintPreset
  className?: string
}

/**
 * Light valence/referenz clouds on top of compose tint — must stay subtle.
 * Pauses off-screen for long lists.
 */
export function GridTintBackground({
  x: gridX,
  y: gridY = null,
  preset = 'card',
  className,
}: GridTintBackgroundProps) {
  const pos = useMemo(() => ({ x: gridX, y: gridY }), [gridX, gridY])
  const mesh = useMemo(() => gridTintAuroraMesh(pos, preset), [pos, preset])
  const drift = useMemo(() => gridTintAuroraDrift(pos, preset), [pos, preset])
  const rootRef = useRef<HTMLDivElement>(null)
  const [animate, setAnimate] = useState(false)
  const shouldAnimate = gridTintShouldAnimate(preset)

  useEffect(() => {
    const el = rootRef.current
    if (!el || !drift || !shouldAnimate) return

    const io = new IntersectionObserver(
      ([e]) => setAnimate(e.isIntersecting),
      { rootMargin: '64px 0px', threshold: 0.02 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [drift, shouldAnimate])

  if (!mesh && !drift) return null

  return (
    <div
      ref={rootRef}
      className={cn(
        'grid-tint pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        shouldAnimate && !animate && 'grid-tint--paused',
        className,
      )}
      aria-hidden
    >
      {mesh && (
        <div
          className="grid-tint-veil grid-tint-veil--mesh"
          style={{ backgroundImage: mesh }}
        />
      )}
      {drift && (
        <>
          <div
            className="grid-tint-veil grid-tint-veil--drift-a"
            style={{ backgroundImage: drift.a }}
          />
          <div
            className="grid-tint-veil grid-tint-veil--drift-b"
            style={{ backgroundImage: drift.b }}
          />
        </>
      )}
      <div className="grid-tint-grain" />
    </div>
  )
}
