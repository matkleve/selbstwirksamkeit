'use client'

import { useState } from 'react'
import { User, Users } from 'lucide-react'
import { catmullRomPath } from '@/lib/trailPath'
import {
  TRAJECTORY_CHART_ASPECT,
  TRAJECTORY_CHART_H,
  TRAJECTORY_CHART_W,
} from '@/lib/trajectoryChartLayout'
import { AxisGradientDefs } from '@/components/AxisGradientDefs'
import {
  patternSeriesColor,
  slotShortLabel,
  type PatternAxisMode,
  type PatternSeries,
  type PatternSlot,
} from '@/lib/trajectoryPattern'

const W = TRAJECTORY_CHART_W
const H = TRAJECTORY_CHART_H
const M = { top: 8, right: 4, bottom: 4, left: 28 }
const Y_TICKS = [-5, 0, 5] as const
const PLOT_W = W - M.left - M.right
const PLOT_H = H - M.top - M.bottom
const Y_MIN = -5
const Y_MAX = 5

function yPos(v: number) {
  return M.top + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * PLOT_H
}

function xPos(i: number, n: number) {
  if (n <= 1) return M.left + PLOT_W / 2
  return M.left + (i / (n - 1)) * PLOT_W
}

function smoothPathsForSeries(values: (number | null)[], slotCount: number): string[] {
  const paths: string[] = []
  let run: { x: number; y: number }[] = []

  const flush = () => {
    if (run.length >= 2) paths.push(catmullRomPath(run))
    run = []
  }

  for (let i = 0; i < slotCount; i++) {
    const v = values[i]
    if (v == null) {
      flush()
      continue
    }
    run.push({ x: xPos(i, slotCount), y: yPos(v) })
  }
  flush()
  return paths
}

interface Props {
  series: PatternSeries[]
  slots: PatternSlot[]
  mode: PatternAxisMode
}

export default function TrajectoryPatternChart({ series, slots, mode }: Props) {
  const [tip, setTip] = useState<{
    slotLabel: string
    lines: {
      year: string
      value: number
      avgGridX: number
      avgGridY: number
      count: number
    }[]
  } | null>(null)

  const gradId = `pattern-y-${mode}`
  const n = slots.length
  const singleSeries = series.length === 1
  const multiYear = series.length > 1
  const colW = n > 1 ? PLOT_W / (n - 1) : PLOT_W

  return (
    <div>
      <div className="relative w-full" style={{ aspectRatio: TRAJECTORY_CHART_ASPECT }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="size-full"
          role="img"
          aria-label="Zeitspur Muster"
        >
          <AxisGradientDefs
            id={gradId}
            mode={mode}
            yTop={yPos(5)}
            yBottom={yPos(-5)}
          />

          <line
            x1={M.left}
            x2={W - M.right}
            y1={yPos(0)}
            y2={yPos(0)}
            stroke="var(--border)"
            strokeWidth={1}
          />

          {Y_TICKS.map(tick => (
            <g key={tick}>
              <line
                x1={M.left - 2}
                x2={M.left}
                y1={yPos(tick)}
                y2={yPos(tick)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              {mode === 'referenz' && tick !== 0 ? (
                <foreignObject
                  x={0}
                  y={yPos(tick) - 6}
                  width={M.left - 6}
                  height={12}
                >
                  <div className="flex h-full items-center justify-end text-ink-3">
                    {tick > 0 ? (
                      <Users size={10} strokeWidth={1.5} aria-hidden />
                    ) : (
                      <User size={10} strokeWidth={1.5} aria-hidden />
                    )}
                  </div>
                </foreignObject>
              ) : (
                <text
                  x={M.left - 4}
                  y={yPos(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="var(--text-muted)"
                  fontSize={9}
                >
                  {tick === 0 ? '0' : tick > 0 ? '+' : '−'}
                </text>
              )}
            </g>
          ))}

          {series.map(s => {
            const values = Array.from({ length: n }, (_, i) => {
              const p = s.points.find(pt => pt.slotIndex === i) ?? s.points[i]
              return p?.value ?? null
            })
            const paths = smoothPathsForSeries(values, n)
            if (!paths.length) return null
            const stroke = singleSeries ? `url(#${gradId})` : patternSeriesColor(s)
            return paths.map((d, pi) => (
              <path
                key={`${s.id}-${pi}`}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={singleSeries ? 1.75 : 1.35}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={singleSeries ? 1 : s.opacity}
                vectorEffect="non-scaling-stroke"
              />
            ))
          })}

          {slots.map((slot, i) => {
            const cx = xPos(i, n)
            const hits = series
              .map(s => {
                const p = s.points[i]
                if (!p || p.value == null) return null
                return {
                  year: s.label,
                  value: p.value,
                  avgGridX: p.avgGridX,
                  avgGridY: p.avgGridY,
                  count: p.count,
                }
              })
              .filter((x): x is NonNullable<typeof x> => x != null)
            if (!hits.length) return null
            return (
              <rect
                key={slot.key}
                x={cx - colW / 2}
                y={M.top}
                width={colW}
                height={PLOT_H}
                fill="transparent"
                className="cursor-default"
                onPointerEnter={() =>
                  setTip({
                    slotLabel: slot.label,
                    lines: hits,
                  })
                }
                onPointerLeave={() => setTip(null)}
              />
            )
          })}
        </svg>

        {multiYear && (
          <div
            className="pointer-events-none absolute top-1.5 right-1 z-20 flex flex-col gap-0.5 rounded-md border border-edge bg-card px-2 py-1 shadow-[var(--shadow-pop)]"
            aria-label="Jahre"
          >
            {series.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-end gap-1.5 tabular-nums"
              >
                <span
                  className="h-0.5 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: patternSeriesColor(s),
                    opacity: s.opacity,
                  }}
                />
                <span className="text-[0.625rem] leading-none text-ink-2">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {tip && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-2">
            <div className="rounded-lg border border-edge bg-card px-2.5 py-1.5 text-[0.6875rem] shadow-[var(--shadow-pop)]">
              <p className="mb-0.5 text-ink-3">{tip.slotLabel}</p>
              {tip.lines.map(l => (
                <p key={l.year} className="tabular-nums text-ink">
                  {series.length > 1 && (
                    <span className="text-ink-3">{l.year} · </span>
                  )}
                  {l.value > 0 ? '+' : ''}
                  {l.value.toFixed(1)}
                  <span className="text-ink-3">
                    {l.count > 0 ? ` · ${l.count}` : ' · geschätzt'}
                  </span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="mt-1 grid text-[0.625rem] leading-none text-ink-3"
        style={{
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          paddingLeft: `${(M.left / W) * 100}%`,
          paddingRight: `${(M.right / W) * 100}%`,
        }}
      >
        {slots.map(slot => (
          <span key={slot.key} className="text-center">
            {slotShortLabel(slot)}
          </span>
        ))}
      </div>

    </div>
  )
}
