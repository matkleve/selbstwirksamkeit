import { nudgeText, timeAgo } from '@/lib/utils'
import type { Entry } from '@/lib/types'
import { Button } from '@/components/button'

const cardClass = 'bg-card border border-border rounded-xl p-5 mb-4'
const labelClass = 'text-[11px] text-muted uppercase tracking-wider mb-2.5'

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
      <Button variant="ghost" onClick={onPickAnother} className="w-full mt-3">
        ↻ Andere Erinnerung
      </Button>
    </>
  )
}
