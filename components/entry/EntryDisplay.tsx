'use client'

import { cn } from '@/lib/cn'
import { getEntryMeta } from '@/lib/entryMeta'
import { getValenceColor } from '@/lib/types'
import type { Entry } from '@/lib/types'
import { EntryDate } from '@/components/entry/EntryDate'
import { EntryMetaChips } from '@/components/entry/EntryMetaChips'

export type EntryDisplayVariant =
  | 'color'
  | 'text'
  | 'compact'
  | 'chips-closed'
  | 'chips-open'
  | 'full'

export type EntryDisplaySize = 'sm' | 'md'

export interface EntryDisplayProps {
  entry: Entry
  variant: EntryDisplayVariant
  size?: EntryDisplaySize
  className?: string
  lines?: 1 | 2 | 3 | 'none'
  /** Datum oben rechts (z. B. „25. März 2026“) */
  showDate?: boolean
  showTitle?: boolean
  children?: React.ReactNode
}

const lineClamp = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  none: '',
} as const

const textSize = {
  sm: 'text-sm leading-snug',
  md: 'text-base leading-relaxed',
} as const

function ColorRail({ entry, size }: { entry: Entry; size: EntryDisplaySize }) {
  const color = getValenceColor(entry.grid_x)
  return (
    <div
      className={cn(
        'shrink-0 rounded-sm',
        size === 'sm' ? 'w-0.5 min-h-[2rem]' : 'w-1 min-h-[2.5rem]',
      )}
      style={{ background: color }}
      aria-hidden
    />
  )
}

function ColorDot({ entry, size }: { entry: Entry; size: EntryDisplaySize }) {
  const color = getValenceColor(entry.grid_x)
  return (
    <div
      className={cn('shrink-0 rounded-[3px]', size === 'sm' ? 'size-[11px]' : 'size-3')}
      style={{ background: color, opacity: 0.85 }}
      title={entry.text.slice(0, 60)}
      aria-hidden
    />
  )
}

function TextWithDate({
  text,
  dateStr,
  textClassName,
  showDate,
}: {
  text: string
  dateStr: string
  textClassName: string
  showDate: boolean
}) {
  if (!showDate) {
    return <p className={textClassName}>{text}</p>
  }
  return (
    <div className="flex items-start justify-between gap-3">
      <p className={cn(textClassName, 'min-w-0 flex-1')}>{text}</p>
      <EntryDate dateStr={dateStr} className="pt-0.5" />
    </div>
  )
}

export function EntryDisplay({
  entry,
  variant,
  size = 'md',
  className,
  lines = 2,
  showDate = false,
  showTitle = false,
  children,
}: EntryDisplayProps) {
  const meta = getEntryMeta(entry)
  const clamp = lineClamp[lines]
  const textCls = cn(textSize[size], 'text-ink', clamp)

  if (variant === 'color') {
    return (
      <div className={cn('inline-flex', className)} title={entry.text.slice(0, 80)}>
        <ColorDot entry={entry} size={size} />
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={cn('min-w-0', className)}>
        {showTitle && entry.title && (
          <p className="mb-0.5 text-xs font-medium text-ink-2">{entry.title}</p>
        )}
        <TextWithDate
          text={entry.text}
          dateStr={entry.created_at}
          textClassName={cn(textCls, 'text-ink-2')}
          showDate={showDate}
        />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex min-w-0 items-start gap-2.5', className)}>
        <ColorRail entry={entry} size={size} />
        <div className="min-w-0 flex-1">
          <TextWithDate
            text={entry.text}
            dateStr={entry.created_at}
            textClassName={cn(textCls, 'm-0 text-ink-2')}
            showDate={showDate}
          />
        </div>
      </div>
    )
  }

  if (variant === 'chips-closed' || variant === 'chips-open') {
    const chipMode = variant === 'chips-closed' ? 'closed' : 'open'
    return (
      <div className={cn('min-w-0 space-y-2', className)}>
        {showDate && (
          <div className="flex justify-end">
            <EntryDate dateStr={entry.created_at} />
          </div>
        )}
        <p className={cn(textCls, 'text-ink-2')}>{entry.text}</p>
        <EntryMetaChips groups={meta} mode={chipMode} size={size} />
      </div>
    )
  }

  return (
    <div className={cn('flex min-w-0 gap-0', className)}>
      <ColorRail entry={entry} size={size} />
      <div className="min-w-0 flex-1 py-0.5 pl-3">
        {showDate && (
          <div className="mb-1.5 flex justify-end">
            <EntryDate dateStr={entry.created_at} />
          </div>
        )}
        {showTitle && entry.title && (
          <p className="mb-1 text-xs font-medium text-ink-2">{entry.title}</p>
        )}
        <p className={cn(textCls, lines === 'none' ? '' : clamp, 'mb-2 text-ink')}>
          &ldquo;{entry.text}&rdquo;
        </p>
        {meta.length > 0 && (
          <EntryMetaChips groups={meta} mode="open" size={size} className="mb-2" />
        )}
        {children}
      </div>
    </div>
  )
}
