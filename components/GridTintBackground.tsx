'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  gridTintBlobColor,
  gridTintBlobWidth,
  gridTintLayers,
  gridTintShouldAnimate,
  type GridPosition,
  type GridTintBlob,
  type GridTintPreset,
} from '@/lib/gridTint'

export interface GridTintBackgroundProps extends GridPosition {
  preset?: GridTintPreset
  className?: string
}

function renderBlob(
  b: GridTintBlob,
  preset: GridTintPreset,
  key: string,
) {
  return (
    <div
      key={key}
      className={cn(
        'grid-tint-blob',
        `grid-tint-blob--${b.variant}`,
        b.layer === 'hero' ? 'grid-tint-blob--hero' : 'grid-tint-blob--smoke',
      )}
      style={{
        left: `${b.left}%`,
        top: `${b.top}%`,
        width: `${gridTintBlobWidth(b, preset)}%`,
        opacity: b.opacity,
        backgroundColor: gridTintBlobColor(b.rgb, b.layer, preset),
      }}
    />
  )
}

/**
 * Coloured smoke + hero tint from grid position (Ember & Jade).
 * Place inside `position: relative; overflow: hidden` — content in `relative z-[1]`.
 *
 * Presets: `card` | `card-compact` | `button` | `flat`
 */
export function GridTintBackground({
  x: gridX,
  y: gridY = null,
  preset = 'card',
  className,
}: GridTintBackgroundProps) {
  const layers = gridTintLayers({ x: gridX, y: gridY }, preset)
  const rootRef = useRef<HTMLDivElement>(null)
  const [animate, setAnimate] = useState(false)
  const shouldAnimate = gridTintShouldAnimate(preset)

  useEffect(() => {
    const el = rootRef.current
    if (!el || !layers || !shouldAnimate) return

    const io = new IntersectionObserver(
      ([e]) => setAnimate(e.isIntersecting),
      { rootMargin: '80px 0px', threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [layers, shouldAnimate, gridX, gridY, preset])

  if (!layers) return null

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
      <div className="grid-tint-smoke">
        {layers.smoke.map((b, i) => renderBlob(b, preset, `s-${i}`))}
      </div>
      {renderBlob(layers.hero, preset, 'hero')}
    </div>
  )
}
