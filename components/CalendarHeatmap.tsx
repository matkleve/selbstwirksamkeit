'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getValenceColor } from '@/lib/types'

export interface CalDay {
  dateStr: string
  count: number
  avgValence: number | null
}

interface Props {
  weeks: CalDay[][]
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const DAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So']
const GAP = 3
const LABEL_W = 18
const MIN_CELL = 11
const MAX_CELL = 20
const ROWS = 7

export default function CalendarHeatmap({ weeks }: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(12)

  const n = weeks.length
  const gridH = ROWS * cell + (ROWS - 1) * GAP
  const monthH = 14

  useLayoutEffect(() => {
    const outer = outerRef.current
    if (!outer || n === 0) return

    const update = () => {
      const avail = outer.clientWidth - LABEL_W - 4
      const fit = Math.floor((avail - (n - 1) * GAP) / n)
      const natural = n * MIN_CELL + (n - 1) * GAP
      if (natural <= avail) {
        setCell(Math.max(MIN_CELL, Math.min(MAX_CELL, fit)))
      } else {
        setCell(MIN_CELL)
      }
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(outer)
    return () => ro.disconnect()
  }, [n])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = el.scrollWidth - el.clientWidth
  }, [weeks, cell])

  if (!n) return null

  const contentW = n * cell + (n - 1) * GAP

  return (
    <div
      ref={outerRef}
      className="w-full overflow-hidden"
      style={{ minHeight: monthH + 4 + gridH }}
    >
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto overflow-y-hidden overscroll-x-contain"
        style={{ touchAction: 'pan-x' }}
      >
        <div className="inline-flex min-w-full flex-col" style={{ width: contentW }}>
          <div className="mb-1 flex gap-[3px]" style={{ marginLeft: LABEL_W + 4 }}>
            {weeks.map((week, wi) => {
              const d = new Date(week[0].dateStr + 'T12:00:00')
              const prev = wi > 0 ? new Date(weeks[wi - 1][0].dateStr + 'T12:00:00') : null
              const show = wi === 0 || (prev && d.getMonth() !== prev.getMonth())
              return (
                <div
                  key={wi}
                  className="shrink-0 text-[9px] text-ink-3"
                  style={{ width: cell }}
                >
                  {show ? MONTH_ABBR[d.getMonth()] : ''}
                </div>
              )
            })}
          </div>

          <div className="flex gap-[3px]">
            <div className="mr-1 flex shrink-0 flex-col gap-[3px]" style={{ width: LABEL_W }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="flex items-center text-[9px] text-ink-3"
                  style={{ height: cell }}
                >
                  {label}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="flex shrink-0 flex-col gap-[3px]">
                {week.map((day, di) => {
                  const pct = day.count === 0 ? 0 : Math.min(45 + (day.count - 1) * 15, 80)
                  const bg = day.count === 0
                    ? 'var(--bg-subtle)'
                    : `color-mix(in srgb, ${getValenceColor(day.avgValence)} ${pct}%, var(--bg-subtle))`
                  const title = day.count > 0
                    ? `${day.dateStr}: ${day.count} Eintrag${day.count > 1 ? 'e' : ''}, Ø ${day.avgValence?.toFixed(1) ?? '–'}`
                    : day.dateStr
                  return (
                    <div
                      key={di}
                      title={title}
                      className="shrink-0 rounded-[2px]"
                      style={{ width: cell, height: cell, background: bg }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
