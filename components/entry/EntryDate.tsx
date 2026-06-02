import { formatEntryDate } from '@/lib/utils'
import { cn } from '@/lib/cn'

export function EntryDate({
  dateStr,
  className,
}: {
  dateStr: string
  className?: string
}) {
  return (
    <time
      dateTime={dateStr}
      className={cn('shrink-0 text-xs leading-none text-ink-3', className)}
    >
      {formatEntryDate(dateStr)}
    </time>
  )
}
