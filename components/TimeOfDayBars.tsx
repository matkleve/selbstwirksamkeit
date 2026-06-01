import { getValenceColor } from '@/lib/types'

export interface DayPeriod {
  label: string
  sublabel: string
  count: number
  avgValence: number | null
}

interface Props {
  periods: DayPeriod[]
}

const BAR_H = 80

export default function TimeOfDayBars({ periods }: Props) {
  const maxCount = Math.max(...periods.map(p => p.count), 1)

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, height: BAR_H, position: 'relative' }}>
        {periods.map(({ label, count, avgValence }) => {
          const barH = count > 0 ? Math.max((count / maxCount) * BAR_H, 8) : 3
          const color = count > 0 ? getValenceColor(avgValence) : 'var(--bg-subtle)'
          return (
            <div key={label} style={{ flex: 1, position: 'relative' }}>
              {count > 0 && (
                <span style={{
                  position: 'absolute',
                  bottom: barH + 5,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {count}
                </span>
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '12%',
                right: '12%',
                height: barH,
                borderRadius: '4px 4px 0 0',
                background: color,
                opacity: count > 0 ? 0.75 : 0.2,
              }} />
            </div>
          )
        })}
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 10 }} />

      <div style={{ display: 'flex', gap: 10 }}>
        {periods.map(({ label, sublabel }) => (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{sublabel}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
