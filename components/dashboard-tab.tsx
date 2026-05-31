import { isToday, calcStreak, nudgeText, timeAgo } from '@/lib/utils'
import type { Entry } from '@/lib/types'
import { CategoryPills } from '@/components/category-pills'

const cardClass = 'bg-card border border-border rounded-xl p-5 mb-4'
const labelClass = 'text-[11px] text-muted uppercase tracking-wider mb-2.5'
const primaryBtnClass =
  'bg-primary text-primary-fg border-0 rounded-lg px-[18px] py-2 text-sm cursor-pointer font-inherit disabled:opacity-45 disabled:cursor-not-allowed'

function pickFrom(entries: Entry[], minDays: number, maxDays: number): Entry | null {
  const pool = entries.filter(e => {
    const d = (Date.now() - new Date(e.created_at).getTime()) / 86400000
    return d >= minDays && d < maxDays
  })
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
}

export function DashboardTab({
  entries,
  onAddClick,
}: {
  entries: Entry[]
  onAddClick: () => void
}) {
  const todayEntries = entries.filter(e => isToday(e.created_at))
  const streak = calcStreak(entries)
  const memories = [pickFrom(entries, 1, 7), pickFrom(entries, 7, 30), pickFrom(entries, 30, 365)].filter(
    Boolean
  ) as Entry[]

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className={`${cardClass} mb-0 text-center`}>
          <div className="text-[32px] font-semibold leading-none">{todayEntries.length}</div>
          <div className="text-xs text-muted mt-1">
            {todayEntries.length === 1 ? 'Erfolg heute' : 'Erfolge heute'}
          </div>
        </div>
        <div className={`${cardClass} mb-0 text-center`}>
          <div className="text-[32px] font-semibold leading-none">{streak}</div>
          <div className="text-xs text-muted mt-1">
            {streak === 1 ? 'Tag in Folge' : 'Tage in Folge'}
          </div>
        </div>
      </div>

      {todayEntries.length > 0 && (
        <div className={cardClass}>
          <div className={labelClass}>Heute eingetragen</div>
          {todayEntries.map(e => (
            <div key={e.id} className="border-l-2 border-accent pl-3 mb-2 text-[15px] leading-snug last:mb-0">
              {e.text}
              <CategoryPills categories={e.categories ?? []} className="mt-0.5" />
            </div>
          ))}
        </div>
      )}

      {memories.length > 0 && (
        <>
          <div className={`${labelClass} mb-2.5`}>Erinnerst du dich noch?</div>
          {memories.map(m => (
            <div key={m.id} className={`${cardClass} mb-2.5 border-l-2 border-accent rounded-l-none rounded-r-xl`}>
              <p className="text-[15px] italic leading-relaxed mb-1.5">&ldquo;{m.text}&rdquo;</p>
              <p className="text-xs">
                <span className="text-accent font-medium">{nudgeText(m.created_at)}</span>
                {' '}
                <span className="text-muted">— {timeAgo(m.created_at)}</span>
              </p>
            </div>
          ))}
        </>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted text-sm mb-4">Noch keine Einträge. Fang jetzt an!</p>
          <button type="button" onClick={onAddClick} className={primaryBtnClass}>
            + Ersten Erfolg eintragen
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <button type="button" onClick={onAddClick} className={`${primaryBtnClass} w-full mt-1`}>
          + Neuen Erfolg eintragen
        </button>
      )}
    </>
  )
}
