'use client'

import { cn } from '@/lib/cn'

export function MirrorTypingCursor() {
  return <span className="mirror-blink ml-0.5 inline-block">|</span>
}

export function MirrorRevealWords({
  words,
  visibleCount,
  className,
  as: Tag = 'span',
  showCursor = false,
  dateTime,
}: {
  words: string[]
  visibleCount: number
  className?: string
  as?: 'p' | 'span' | 'time'
  showCursor?: boolean
  dateTime?: string
}) {
  const shown = words.slice(0, visibleCount)
  const typing = showCursor && visibleCount < words.length

  return (
    <Tag className={cn('m-0', className)} {...(Tag === 'time' && dateTime ? { dateTime } : {})}>
      {shown.map((word, i) => (
        <span key={`${i}-${word}`} className="mirror-word-fade whitespace-pre-wrap">
          {i > 0 ? ' ' : ''}
          {word}
        </span>
      ))}
      {typing && <MirrorTypingCursor />}
    </Tag>
  )
}
