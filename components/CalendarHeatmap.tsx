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
const CELL = 12
const GAP = 3

export default function CalendarHeatmap({ weeks }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
        {/* Month labels */}
        <div style={{ display: 'flex', gap: GAP, marginLeft: 22, marginBottom: 5 }}>
          {weeks.map((week, wi) => {
            const d = new Date(week[0].dateStr)
            const prev = wi > 0 ? new Date(weeks[wi - 1][0].dateStr) : null
            const show = wi === 0 || (prev && d.getMonth() !== prev.getMonth())
            return (
              <div key={wi} style={{ width: CELL, fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {show ? MONTH_ABBR[d.getMonth()] : ''}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: GAP }}>
          {/* Day-of-week labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 4 }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{ width: 14, height: CELL, fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
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
                    style={{ width: CELL, height: CELL, borderRadius: 2, background: bg }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
