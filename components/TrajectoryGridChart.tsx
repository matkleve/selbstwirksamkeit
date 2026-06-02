'use client'

import { Users, User, Minus, Plus } from 'lucide-react'
import { catmullRomPath } from '@/lib/trailPath'
import { bilinearColor } from '@/lib/gridZones'
import type { Entry } from '@/lib/types'

function gridPct(x: number, y: number) {
  return { left: ((x + 5) / 10) * 100, top: ((5 - y) / 10) * 100 }
}

function entryOpacity(createdAt: string, newestMs: number, oldestMs: number): number {
  const t = new Date(createdAt).getTime()
  const range = newestMs - oldestMs
  if (range <= 0) return 1
  return 0.25 + 0.75 * (1 - (newestMs - t) / range)
}

interface Props {
  entries: Entry[]
}

export default function TrajectoryGridChart({ entries }: Props) {
  const pts = entries
    .filter(e => e.grid_x !== null && e.grid_y !== null)
    .map(e => ({
      id: e.id,
      x: e.grid_x!,
      y: e.grid_y!,
      created_at: e.created_at,
      pct: gridPct(e.grid_x!, e.grid_y!),
    }))

  if (!pts.length) {
    return (
      <p className="py-6 text-center text-sm text-ink-3">Keine Einträge mit Feld-Koordinaten.</p>
    )
  }

  const trailPts = pts.map(p => ({ x: p.pct.left, y: p.pct.top }))
  const newestMs = new Date(pts[pts.length - 1].created_at).getTime()
  const oldestMs = new Date(pts[0].created_at).getTime()
  const showTrail = pts.length > 1

  return (
    <div
      className="grid w-full max-w-[280px] mx-auto gap-0"
      style={{ gridTemplateColumns: 'auto 1fr auto', gridTemplateRows: 'auto 1fr auto' }}
    >
      <div />
      <div className="flex items-center justify-center gap-1 pb-2 text-[0.6875rem] text-ink-2">
        <Users size={12} strokeWidth={1.5} aria-hidden />
        <span>andere</span>
      </div>
      <div />

      <div className="flex items-center pr-2.5 text-ink-3">
        <Minus size={14} strokeWidth={1.5} aria-hidden />
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-field bg-subtle p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="absolute inset-3">
          <div
            className="pointer-events-none absolute inset-0 bg-center [background-image:radial-gradient(circle,var(--grid-dot)_1px,transparent_0)] [background-size:28px_28px]"
            aria-hidden
          />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
            {showTrail && (
              <path
                d={catmullRomPath(trailPts)}
                fill="none"
                stroke="var(--border-focus)"
                strokeWidth={0.6}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.45}
              />
            )}
          </svg>
          {pts.map(p => {
            const [r, g, b] = bilinearColor(p.x, p.y)
            const op = entryOpacity(p.created_at, newestMs, oldestMs)
            return (
              <div
                key={p.id}
                className="absolute size-2.5 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${p.pct.left}%`,
                  top: `${p.pct.top}%`,
                  background: `rgb(${r},${g},${b})`,
                  opacity: op,
                  boxShadow: `0 0 6px 2px rgba(${r},${g},${b},${0.4 * op})`,
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="flex items-center pl-2.5 text-ink-3">
        <Plus size={14} strokeWidth={1.5} aria-hidden />
      </div>

      <div />
      <div className="flex items-center justify-center gap-1 pt-2 text-[0.6875rem] text-ink-2">
        <User size={12} strokeWidth={1.5} aria-hidden />
        <span>ich</span>
      </div>
      <div />
    </div>
  )
}
