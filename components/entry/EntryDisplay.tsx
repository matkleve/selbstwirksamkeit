'use client'

import { cn } from '@/lib/cn'
import { entryCorrelationColor } from '@/lib/entryCardTint'
import { getEntryMeta } from '@/lib/entryMeta'
import type { Entry } from '@/lib/types'
import { useEntries } from '@/components/EntriesProvider'
import { EntryCardShell } from '@/components/entry/EntryCardShell'
import { EntryCardMenu } from '@/components/entry/EntryCardMenu'
import { EntryDate } from '@/components/entry/EntryDate'
import { EntryMetaChips } from '@/components/entry/EntryMetaChips'
import { formatMirrorDateTime } from '@/lib/mirrorTransition'
import { MirrorRevealWords } from '@/components/mirror/MirrorRevealWords'
import { splitRevealWords } from '@/lib/mirrorReveal'
import type { ReactNode } from 'react'

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
  /** @deprecated Header always shows date when entry number is available */
  showDate?: boolean
  /** Mirror timeline: date+time only, right-aligned */
  header?: 'default' | 'mirror'
  /** Override chronological number (Entry #N) */
  entryNumber?: number
  showTitle?: boolean
  /** Tinted card surface (default: true except variant full) */
  card?: boolean
  /** ⋮ menu with edit / delete (default: true except color) */
  menu?: boolean
  /** Mirror: expand chips that match the pattern association */
  relevantMeta?: string[]
  /** Mirror: progressive word/chip reveal */
  reveal?: {
    headerWordCount: number
    bodyWordCount: number
    chipCount: number
  }
  children?: ReactNode
}

const lineClamp = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  none: '',
} as const

const entryTextStyle = {
  sm: 'font-display text-[0.9375rem] italic leading-snug text-ink-2',
  md: 'font-display text-base italic leading-relaxed text-ink-2',
} as const

function ColorRail({ entry, size }: { entry: Entry; size: EntryDisplaySize }) {
  return (
    <div
      className={cn(
        'shrink-0 rounded-sm',
        size === 'sm' ? 'w-0.5 min-h-[2rem]' : 'w-1 min-h-[2.5rem]',
      )}
      style={{ background: entryCorrelationColor(entry) }}
      aria-hidden
    />
  )
}

function ColorDot({ entry, size }: { entry: Entry; size: EntryDisplaySize }) {
  return (
    <div
      className={cn('shrink-0 rounded-[3px]', size === 'sm' ? 'size-[11px]' : 'size-3')}
      style={{ background: entryCorrelationColor(entry) }}
      title={entry.text.slice(0, 60)}
      aria-hidden
    />
  )
}

function MirrorEntryHeader({
  dateStr,
  reveal,
}: {
  dateStr: string
  reveal?: EntryDisplayProps['reveal']
}) {
  const words = splitRevealWords(formatMirrorDateTime(dateStr))
  const visible = reveal ? reveal.headerWordCount : words.length
  return (
    <div className="mb-1.5 flex justify-end">
      <MirrorRevealWords
        as="time"
        dateTime={dateStr}
        words={words}
        visibleCount={visible}
        showCursor={!!reveal && visible < words.length}
        className="text-xs uppercase tracking-wide text-ink-3"
      />
    </div>
  )
}

function EntryHeader({
  entry,
  number,
  dateStr,
  showDate,
  showMenu,
}: {
  entry: Entry
  number: number | null
  dateStr: string
  showDate: boolean
  showMenu: boolean
}) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <span className="min-w-0 truncate text-xs font-medium text-ink-3">
        {number != null ? `Entry #${number}` : 'Entry'}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        {showDate && <EntryDate dateStr={dateStr} className="mr-0.5" />}
        {showMenu && <EntryCardMenu entry={entry} />}
      </div>
    </div>
  )
}

function EntryBody({
  text,
  size,
  lines,
  className,
}: {
  text: string
  size: EntryDisplaySize
  lines: 1 | 2 | 3 | 'none'
  className?: string
}) {
  return (
    <p className={cn(entryTextStyle[size], lineClamp[lines], className)}>
      {text}
    </p>
  )
}

function wrapCard(
  entry: Entry,
  card: boolean,
  padding: 'sm' | 'md',
  className: string | undefined,
  content: ReactNode,
  mirrorAnimate = false,
) {
  if (!card) {
    return <div className={cn('min-w-0', className)}>{content}</div>
  }
  return (
    <EntryCardShell
      entry={entry}
      padding={padding}
      className={cn('min-w-0', mirrorAnimate && 'mirror-reveal-in', className)}
    >
      {content}
    </EntryCardShell>
  )
}

export function EntryDisplay({
  entry,
  variant,
  size = 'md',
  className,
  lines = 2,
  showDate = true,
  header = 'default',
  entryNumber: entryNumberProp,
  showTitle = false,
  card: cardProp,
  menu: menuProp,
  relevantMeta,
  reveal,
  children,
}: EntryDisplayProps) {
  const { entryNumber: entryNumberFromCtx } = useEntries()
  const meta = getEntryMeta(entry)
  const number = entryNumberProp ?? entryNumberFromCtx(entry.id)
  const card = cardProp ?? variant !== 'full'
  const showMenu = menuProp ?? variant !== 'color'
  const shellPadding = size === 'sm' ? 'sm' : 'md'

  if (variant === 'color') {
    return (
      <div className={cn('inline-flex', className)} title={entry.text.slice(0, 80)}>
        <ColorDot entry={entry} size={size} />
      </div>
    )
  }

  const headerBlock =
    header === 'mirror' ? (
      <MirrorEntryHeader dateStr={entry.created_at} reveal={reveal} />
    ) : (
      <EntryHeader
        entry={entry}
        number={number}
        dateStr={entry.created_at}
        showDate={showDate}
        showMenu={showMenu}
      />
    )

  if (variant === 'text') {
    return wrapCard(
      entry,
      card,
      shellPadding,
      className,
      <>
        {headerBlock}
        {showTitle && entry.title && (
          <p className="mb-0.5 text-xs font-medium text-ink-2">{entry.title}</p>
        )}
        <EntryBody text={entry.text} size={size} lines={lines} />
      </>,
    )
  }

  if (variant === 'compact') {
    return wrapCard(
      entry,
      card,
      shellPadding,
      className,
      <>
        {headerBlock}
        <div className="flex min-w-0 items-start gap-2.5">
          <ColorRail entry={entry} size={size} />
          <EntryBody text={entry.text} size={size} lines={lines} className="min-w-0 flex-1" />
        </div>
      </>,
    )
  }

  if (variant === 'chips-closed' || variant === 'chips-open') {
    const chipMode =
      variant === 'chips-open'
        ? 'open'
        : relevantMeta?.length
          ? 'selective'
          : 'closed'
    const bodyWords = splitRevealWords(entry.text)
    const bodyVisible = reveal ? reveal.bodyWordCount : bodyWords.length
    return wrapCard(
      entry,
      card,
      shellPadding,
      className,
      <>
        {headerBlock}
        {reveal ? (
          <MirrorRevealWords
            as="p"
            words={bodyWords}
            visibleCount={bodyVisible}
            showCursor={bodyVisible < bodyWords.length}
            className={cn(entryTextStyle[size], lineClamp[lines])}
          />
        ) : (
          <EntryBody text={entry.text} size={size} lines={lines} />
        )}
        <EntryMetaChips
          groups={meta}
          mode={chipMode}
          relevantValues={relevantMeta}
          visibleUnitCount={reveal?.chipCount}
          size={size}
          className="mt-2"
        />
      </>,
    )
  }

  const inner = (
    <div className={cn('flex min-w-0 gap-0', !card && className)}>
      <ColorRail entry={entry} size={size} />
      <div className="min-w-0 flex-1 py-0.5 pl-3">
        {headerBlock}
        {showTitle && entry.title && (
          <p className="mb-1 text-xs font-medium text-ink-2">{entry.title}</p>
        )}
        <EntryBody text={entry.text} size={size} lines={lines} className="mb-2" />
        {meta.length > 0 && (
          <EntryMetaChips groups={meta} mode="open" size={size} className="mb-2" />
        )}
        {children}
      </div>
    </div>
  )

  if (!card) return inner
  return (
    <EntryCardShell entry={entry} padding={shellPadding} className={className}>
      {inner}
    </EntryCardShell>
  )
}
