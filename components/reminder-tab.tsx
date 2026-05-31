import { nudgeText, timeAgo } from '@/lib/utils'
import type { Entry } from '@/lib/types'

const cardClass = 'bg-card border border-border rounded-xl p-5 mb-4'
const labelClass = 'text-[11px] text-muted uppercase tracking-wider mb-2.5'
const ghostBtnClass =
  'bg-transparent text-muted border border-border rounded-lg px-[18px] py-2 text-sm cursor-pointer font-inherit'

export function ReminderTab({
  reminder,
  hasEntries,
  onPickAnother,
}: {
  reminder: Entry | null
  hasEntries: boolean
  onPickAnother: () => void
}) {
  return (
    <>
      {!hasEntries ? (
        <p className="text-muted text-sm text-center py-8">Noch keine Einträge. Trag etwas ein!</p>
      ) : reminder ? (
        <div className={`${cardClass} border-l-2 border-accent rounded-l-none rounded-r-xl`}>
          <div className={`${labelClass} mb-2`}>Erinnerst du dich noch?</div>
          <p className="text-base leading-relaxed italic mb-2.5">&ldquo;{reminder.text}&rdquo;</p>
          <p className="text-[13px]">
            <span className="text-accent font-medium">{nudgeText(reminder.created_at)}</span>
            {' '}
            <span className="text-muted">— {timeAgo(reminder.created_at)}</span>
          </p>
        </div>
      ) : null}
      <button type="button" onClick={onPickAnother} className={`${ghostBtnClass} w-full mt-3`}>
        ↻ Andere Erinnerung
      </button>
    </>
  )
}
