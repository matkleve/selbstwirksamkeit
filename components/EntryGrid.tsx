'use client'

import { useRef, useState } from 'react'
import { Users, User } from 'lucide-react'
import type { GridPoint } from '@/lib/types'
import { bilinearColor } from '@/lib/gridZones'

interface EntryGridProps {
  value: GridPoint
  onChange: (point: GridPoint) => void
}

function snap(v: number): number {
  return Math.max(-5, Math.min(5, Math.round(v * 10) / 10))
}

function gridToPct(p: GridPoint) {
  return { x: ((p.x + 5) / 10) * 100, y: ((5 - p.y) / 10) * 100 }
}

function toSvgPct(p: GridPoint) {
  return gridToPct(p)
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

export default function EntryGrid({ value, onChange }: EntryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [trail, setTrail] = useState<GridPoint[]>([])
  const [trailFading, setTrailFading] = useState(false)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [r, g, b] = bilinearColor(value.x, value.y)
  const dotColor = `rgb(${r},${g},${b})`
  const dotPct = gridToPct(value)

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

  const axisLabel: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: '0.6875rem', color: 'var(--text-secondary)',
    userSelect: 'none', whiteSpace: 'nowrap',
  }
  const sideLabel: React.CSSProperties = {
    fontSize: '1rem', color: 'var(--text-muted)',
    userSelect: 'none', lineHeight: 1,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gridTemplateRows: 'auto 1fr auto', gap: 0, width: '100%' }}>
      {/* row 1 */}
      <div />
      <div style={{ ...axisLabel, justifyContent: 'center', paddingBottom: 8 }}>
        <Users size={12} strokeWidth={1.5} /> <span>andere</span>
      </div>
      <div />

      {/* row 2 */}
      <div style={{ ...sideLabel, display: 'flex', alignItems: 'center', paddingRight: 10 }}>−</div>

      {/* The grid */}
      <div
        ref={gridRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-field)] cursor-crosshair touch-none select-none bg-subtle p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(0,0,0,0.04)]"
      >
        <div
          className="absolute inset-3 pointer-events-none bg-subtle bg-center [background-image:radial-gradient(circle,var(--grid-dot)_1px,transparent_0)] [background-size:28px_28px]"
          aria-hidden
        >
          {trail.length > 1 && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full"
              style={{
                opacity: trailFading ? 0 : 0.5,
                transition: trailFading ? 'opacity 1500ms ease' : 'none',
              }}
            >
              <path
                d={catmullRomPath(trail)}
                fill="none"
                stroke={dotColor}
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
              left: `${dotPct.x}%`,
              top: `${dotPct.y}%`,
              background: dotColor,
              boxShadow: `0 0 10px 4px rgba(${r},${g},${b},0.55), 0 0 20px 8px rgba(${r},${g},${b},0.25)`,
              transition: isDragging.current ? 'none' : 'left 60ms ease, top 60ms ease',
            }}
          />
        </div>
      </div>

      <div style={{ ...sideLabel, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>+</div>

      {/* row 3 */}
      <div />
      <div style={{ ...axisLabel, justifyContent: 'center', paddingTop: 8 }}>
        <User size={12} strokeWidth={1.5} /> <span>ich</span>
      </div>
      <div />
    </div>
  )
}
