'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  gridTintCloudFill,
  gridTintClouds,
  gridTintShouldAnimate,
  type GridPosition,
  type GridTintPreset,
} from '@/lib/gridTint'

export interface GridTintBackgroundProps extends GridPosition {
  preset?: GridTintPreset
  className?: string
}

/**
 * Soft axis clouds (smoke puffs) on `cardBoxShadow` — drift only, no glow halos.
 */
export function GridTintBackground({
  x: gridX,
  y: gridY = null,
  preset = 'card',
  className,
}: GridTintBackgroundProps) {
  const pos = useMemo(() => ({ x: gridX, y: gridY }), [gridX, gridY])
  const clouds = useMemo(() => gridTintClouds(pos, preset), [pos, preset])
  const rootRef = useRef<HTMLDivElement>(null)
  const [animate, setAnimate] = useState(false)
  const shouldAnimate = gridTintShouldAnimate(preset)

  useEffect(() => {
    const el = rootRef.current
    if (!el || !clouds?.length || !shouldAnimate) return

    const io = new IntersectionObserver(
      ([e]) => setAnimate(e.isIntersecting),
      { rootMargin: '64px 0px', threshold: 0.02 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [clouds, shouldAnimate])

  if (!clouds?.length) return null

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
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className={cn(
            'grid-tint-cloud',
            `grid-tint-cloud--${cloud.axis}`,
            `grid-tint-cloud--p${cloud.phase}`,
          )}
          style={{
            left: `${cloud.left}%`,
            top: `${cloud.top}%`,
            width: `${cloud.sizePct}%`,
            background: gridTintCloudFill(cloud.rgb),
          }}
        />
      ))}
    </div>
  )
}
