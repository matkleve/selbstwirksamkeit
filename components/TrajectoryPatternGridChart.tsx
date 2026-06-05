'use client'

import { useId, useState } from 'react'
import { Minus, Plus, User, Users } from 'lucide-react'
import { gridPct } from '@/lib/gridCoords'
import { bilinearColor } from '@/lib/gridZones'
import { catmullRomPath } from '@/lib/trailPath'
import { TRAJECTORY_FIELD_MAX_SIZE } from '@/lib/trajectoryChartLayout'
import { patternSeriesColor, type PatternSeries, type PatternSlot } from '@/lib/trajectoryPattern'

type PlotPoint = {
  slotIndex: number
  x: number
  y: number
  count: number
  pct: { left: number; top: number }
}

/** Includes imputed slots (count 0) so the path runs through the full cycle. */
function pathPoints(series: PatternSeries): PlotPoint[] {
  return series.points
    .filter(p => p.value != null)
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .map(p => ({
      slotIndex: p.slotIndex,
      x: p.avgGridX,
      y: p.avgGridY,
      count: p.count,
      pct: gridPct(p.avgGridX, p.avgGridY),
    }))
}

interface Props {
  series: PatternSeries[]
  slots: PatternSlot[]
}

export default function TrajectoryPatternGridChart({ series, slots }: Props) {
  const arrowId = useId().replace(/:/g, '')
  const [tip, setTip] = useState<{
    slotLabel: string
    lines: { year: string; x: number; y: number; count: number }[]
  } | null>(null)

  const hasAny = series.some(s => pathPoints(s).length > 0)
  if (!hasAny) {
    return (
      <p className="py-6 text-center text-sm text-ink-3">
        Keine Einträge mit Feld-Koordinaten in diesem Muster.
      </p>
    )
  }

  const multiYear = series.length > 1

  return (
    <div className="flex justify-center">
      <div
        className="relative w-full"
        style={{ width: TRAJECTORY_FIELD_MAX_SIZE, height: TRAJECTORY_FIELD_MAX_SIZE, maxWidth: '100%' }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-0.5 text-[0.625rem] leading-none text-ink-3"
        >
          <Users size={10} strokeWidth={1.5} aria-hidden />
          <span>andere</span>
        </div>
        <div className="pointer-events-none absolute top-1/2 left-0 z-10 -translate-y-1/2 text-ink-3">
          <Minus size={12} strokeWidth={1.5} aria-hidden />
        </div>
        <div className="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 text-ink-3">
          <Plus size={12} strokeWidth={1.5} aria-hidden />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-0.5 text-[0.625rem] leading-none text-ink-3">
          <User size={10} strokeWidth={1.5} aria-hidden />
          <span>ich</span>
        </div>

        <div className="absolute inset-[1.125rem]">
          <div
            className="pointer-events-none absolute inset-0 bg-center [background-image:radial-gradient(circle,var(--grid-dot)_1px,transparent_0)] [background-size:22px_22px]"
            aria-hidden
          />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <marker
                id={arrowId}
                markerUnits="userSpaceOnUse"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-secondary)" />
              </marker>
            </defs>
            {series.map(s => {
              const pts = pathPoints(s)
              if (pts.length < 2) return null
              const color = patternSeriesColor(s)
              const opacity = multiYear ? s.opacity : 0.85
              const trail = pts.map(p => ({ x: p.pct.left, y: p.pct.top }))
              const smooth = catmullRomPath(trail)
              return (
                <g key={s.id} opacity={opacity}>
                  {smooth && (
                    <path
                      d={smooth}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {pts.slice(0, -1).map((p, i) => {
                    const n = pts[i + 1]
                    return (
                      <line
                        key={`${s.id}-seg-${i}`}
                        x1={p.pct.left}
                        y1={p.pct.top}
                        x2={n.pct.left}
                        y2={n.pct.top}
                        stroke={color}
                        strokeWidth={0.65}
                        strokeLinecap="round"
                        strokeDasharray="2 3"
                        opacity={0.55}
                        markerEnd={`url(#${arrowId})`}
                      />
                    )
                  })}
                </g>
              )
            })}
          </svg>
          {series.map(s =>
            pathPoints(s).map(p => {
              const [r, g, b] = bilinearColor(p.x, p.y)
              const slot = slots[p.slotIndex]
              return (
                <button
                  key={`${s.id}-${p.slotIndex}`}
                  type="button"
                  className="absolute size-3 rounded-full -translate-x-1/2 -translate-y-1/2 border border-edge/60"
                  style={{
                    left: `${p.pct.left}%`,
                    top: `${p.pct.top}%`,
                    background: `rgb(${r},${g},${b})`,
                    opacity: s.opacity,
                  }}
                  aria-label={slot?.label}
                  onPointerEnter={() =>
                    setTip({
                      slotLabel: slot?.label ?? '',
                      lines: [{ year: s.label, x: p.x, y: p.y, count: p.count }],
                    })
                  }
                  onPointerLeave={() => setTip(null)}
                />
              )
            }),
          )}
        </div>

        {multiYear && (
          <div
            className="pointer-events-none absolute top-[1.125rem] right-[1.125rem] z-20 flex flex-col gap-0.5 rounded border border-edge bg-card px-1.5 py-0.5 shadow-pop"
            aria-label="Jahre"
          >
            {series.map(s => (
              <div key={s.id} className="flex items-center justify-end gap-1 tabular-nums">
                <span
                  className="h-0.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: patternSeriesColor(s), opacity: s.opacity }}
                />
                <span className="text-[0.5625rem] leading-none text-ink-2">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {tip && (
          <div className="pointer-events-none absolute inset-x-3 top-5 z-30 flex justify-center">
            <div className="rounded-lg border border-edge bg-card px-2 py-1 text-[0.6875rem] shadow-pop">
              <p className="text-ink-3">{tip.slotLabel}</p>
              {tip.lines.map(l => (
                <p key={l.year} className="tabular-nums text-ink">
                  {multiYear && <span className="text-ink-3">{l.year} · </span>}
                  {l.x > 0 ? '+' : ''}{l.x.toFixed(1)} / {l.y > 0 ? '+' : ''}{l.y.toFixed(1)}
                  <span className="text-ink-3">
                    {l.count > 0 ? ` · ${l.count}` : ' · geschätzt'}
                  </span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
