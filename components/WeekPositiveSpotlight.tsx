'use client'

import { useEffect, useRef, useState } from 'react'
import { EntryDisplay } from '@/components/entry'
import { cn } from '@/lib/cn'
import type { Entry } from '@/lib/types'

const ROTATE_MS = 6000
const FADE_MS = 450

function pickNextIndex(length: number, current: number): number {
  if (length <= 1) return 0
  let next = current
  while (next === current) {
    next = Math.floor(Math.random() * length)
  }
  return next
}

interface Props {
  entries: Entry[]
  className?: string
}

export default function WeekPositiveSpotlight({ entries, className }: Props) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const indexRef = useRef(0)

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    if (entries.length <= 1) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rotateMs = reduced ? ROTATE_MS * 2 : ROTATE_MS
    const fadeMs = reduced ? 0 : FADE_MS

    let fadeTimeout: ReturnType<typeof setTimeout> | undefined

    const interval = setInterval(() => {
      if (fadeMs === 0) {
        setIndex(pickNextIndex(entries.length, indexRef.current))
        return
      }
      setVisible(false)
      fadeTimeout = setTimeout(() => {
        setIndex(pickNextIndex(entries.length, indexRef.current))
        setVisible(true)
      }, fadeMs)
    }, rotateMs)

    return () => {
      clearInterval(interval)
      if (fadeTimeout) clearTimeout(fadeTimeout)
    }
  }, [entries.length])

  useEffect(() => {
    setIndex(0)
    setVisible(true)
  }, [entries])

  if (!entries.length) return null

  const entry = entries[index] ?? entries[0]

  return (
    <div
      className={cn(
        'mt-4 transition-opacity duration-[450ms] ease-in-out',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      <EntryDisplay entry={entry} variant="text" size="sm" lines={3} />
    </div>
  )
}
