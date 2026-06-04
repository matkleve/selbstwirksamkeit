'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  gridTintShouldAnimate,
  gridTintVeils,
  type GridPosition,
  type GridTintPreset,
  type GridTintVeil,
} from '@/lib/gridTint'

export interface GridTintBackgroundProps extends GridPosition {
  preset?: GridTintPreset
  className?: string
}

function veilClass(veil: GridTintVeil) {
  if (veil.drift === 'a') return 'grid-tint-veil grid-tint-veil--drift-a'
  if (veil.drift === 'b') return 'grid-tint-veil grid-tint-veil--drift-b'
  return 'grid-tint-veil'
}

/**
 * Two drifting axis colours (valence + referenz) + blend at the grid point.
 * Animation pauses off-screen (safe for long entry lists).
 */
export function GridTintBackground({
  x: gridX,
  y: gridY = null,
  preset = 'card',
  className,
}: GridTintBackgroundProps) {
  const pos = useMemo(() => ({ x: gridX, y: gridY }), [gridX, gridY])
  const veils = useMemo(() => gridTintVeils(pos, preset), [pos, preset])
  const rootRef = useRef<HTMLDivElement>(null)
  const [animate, setAnimate] = useState(false)
  const shouldAnimate = gridTintShouldAnimate(preset)

  useEffect(() => {
    const el = rootRef.current
    if (!el || !veils?.length || !shouldAnimate) return

    const io = new IntersectionObserver(
      ([e]) => setAnimate(e.isIntersecting),
      { rootMargin: '64px 0px', threshold: 0.02 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [veils, shouldAnimate])

  if (!veils?.length) return null

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
      {veils.map(veil => (
        <div
          key={veil.id}
          className={veilClass(veil)}
          style={{ backgroundImage: veil.backgroundImage }}
        />
      ))}
      <div className="grid-tint-grain" />
    </div>
  )
}
