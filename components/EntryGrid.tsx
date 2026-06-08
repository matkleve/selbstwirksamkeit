'use client'

import { useId, useRef, useState } from 'react'
import { Users, User } from 'lucide-react'
import type { GridPoint } from '@/lib/types'
import { gridPct } from '@/lib/gridCoords'
import { bilinearColor } from '@/lib/gridZones'

interface EntryGridProps {
  value: GridPoint
  onChange: (point: GridPoint) => void
}

function snap(v: number): number {
  return Math.max(-5, Math.min(5, Math.round(v * 10) / 10))
}

function toSvgPct(p: GridPoint) {
  const { left, top } = gridPct(p.x, p.y)
  return { x: left, y: top }
}

function readGridPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  padX: number,
  padY: number,
): GridPoint {
  const innerW = rect.width - padX * 2
  const innerH = rect.height - padY * 2
  const nx = Math.max(0, Math.min(1, (clientX - rect.left - padX) / innerW))
  const ny = Math.max(0, Math.min(1, (clientY - rect.top - padY) / innerH))
  return {
    x: snap(nx * 10 - 5),
    y: snap(-(ny * 10 - 5)),
  }
}

function catmullRomPath(points: GridPoint[]): string {
  if (points.length < 2) return ''
  const pts = points.map(toSvgPct)
  if (pts.length === 2) return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x},${p2.y}`
  }
  return d
}

const axisLabelClass =
  'pointer-events-none absolute z-[2] flex items-center gap-1 text-[0.6875rem] text-ink-2 select-none whitespace-nowrap'

export default function EntryGrid({ value, onChange }: EntryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [trail, setTrail] = useState<GridPoint[]>([])
  const [trailFading, setTrailFading] = useState(false)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const trailFilterId = useId().replace(/:/g, '')
  const trailGradId = useId().replace(/:/g, '')
  const [r, g, b] = bilinearColor(value.x, value.y)
  const dotColor = `rgb(${r}, ${g}, ${b})`
  const dotPct = gridPct(value.x, value.y)
  const trailPath = trail.length > 1 ? catmullRomPath(trail) : ''
  const trailEnds =
    trail.length > 1
      ? { start: toSvgPct(trail[0]), end: toSvgPct(trail[trail.length - 1]!) }
      : null

  function readPos(e: React.PointerEvent): GridPoint {
    const el = gridRef.current!
    const rect = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    const padX = parseFloat(s.paddingLeft)
    const padY = parseFloat(s.paddingTop)
    return readGridPoint(e.clientX, e.clientY, rect, padX, padY)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    clearTimeout(fadeTimer.current)
    setTrailFading(false)
    const pos = readPos(e)
    onChange(pos)
    setTrail([pos])
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return
    const pos = readPos(e)
    onChange(pos)
    setTrail(prev => [...prev.slice(-11), pos])
  }

  function handlePointerUp() {
    isDragging.current = false
    setTrailFading(true)
    fadeTimer.current = setTimeout(() => {
      setTrail([])
      setTrailFading(false)
    }, 1500)
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="section-label mb-0.5">Stimmungsfeld</p>
        <p className="text-xs leading-snug text-ink-3">
          Wie fühlt sich dieser Moment an — für dich und im Verhältnis zu anderen?
        </p>
      </div>
      <div
        ref={gridRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative aspect-square w-full overflow-hidden rounded-field cursor-crosshair touch-none select-none bg-subtle p-2.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(0,0,0,0.04)]"
        aria-label="Stimmungsfeld"
      >
        <div className={`${axisLabelClass} inset-x-0 top-2 justify-center`}>
          <Users size={12} strokeWidth={1.5} aria-hidden />
          <span>andere</span>
        </div>
        <div className={`${axisLabelClass} inset-x-0 bottom-2 justify-center`}>
          <User size={12} strokeWidth={1.5} aria-hidden />
          <span>ich</span>
        </div>
        <span
          className={`${axisLabelClass} left-2 top-1/2 -translate-y-1/2 text-base text-ink-3`}
          aria-hidden
        >
          −
        </span>
        <span
          className={`${axisLabelClass} right-2 top-1/2 -translate-y-1/2 text-base text-ink-3`}
          aria-hidden
        >
          +
        </span>
  
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden [background-image:radial-gradient(circle,var(--grid-dot)_1px,transparent_0)] [background-size:28px_28px] [background-position:14px_14px]"
          aria-hidden
        >
          {trailPath && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full"
              style={{
                opacity: trailFading ? 0 : 1,
                transition: trailFading ? 'opacity 1500ms ease' : 'none',
              }}
            >
              <defs>
                {trailEnds && (
                  <linearGradient
                    id={trailGradId}
                    gradientUnits="userSpaceOnUse"
                    x1={trailEnds.start.x}
                    y1={trailEnds.start.y}
                    x2={trailEnds.end.x}
                    y2={trailEnds.end.y}
                  >
                    <stop offset="0%" stopColor={dotColor} stopOpacity={0} />
                    <stop offset="30%" stopColor={dotColor} stopOpacity={0.08} />
                    <stop offset="70%" stopColor={dotColor} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={dotColor} stopOpacity={0.38} />
                  </linearGradient>
                )}
                <filter
                  id={trailFilterId}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                  colorInterpolationFilters="sRGB"
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" />
                </filter>
              </defs>
              <path
                d={trailPath}
                fill="none"
                stroke={`url(#${trailGradId})`}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                filter={`url(#${trailFilterId})`}
              />
              <path
                d={trailPath}
                fill="none"
                stroke={`url(#${trailGradId})`}
                strokeWidth={1}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
  
          <div
            className="absolute size-2.5 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${dotPct.left}%`,
              top: `${dotPct.top}%`,
              background: dotColor,
              boxShadow: `0 0 10px 4px rgba(${r},${g},${b},0.55), 0 0 20px 8px rgba(${r},${g},${b},0.25)`,
              transition: isDragging.current ? 'none' : 'left 60ms ease, top 60ms ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
