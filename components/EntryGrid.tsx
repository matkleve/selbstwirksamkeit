'use client'

import { useRef } from 'react'
import type { GridPoint } from '@/lib/types'
import { getValenceColor } from '@/lib/types'

interface EntryGridProps {
  value: GridPoint | null
  onChange: (point: GridPoint) => void
  size?: number
}

export default function EntryGrid({ value, onChange, size = 280 }: EntryGridProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handlePointer = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const rawX = ((e.clientX - rect.left) / rect.width) * 10 - 5
    const rawY = -(((e.clientY - rect.top) / rect.height) * 10 - 5)
    const x = Math.max(-5, Math.min(5, Math.round(rawX * 2) / 2))
    const y = Math.max(-5, Math.min(5, Math.round(rawY * 2) / 2))
    onChange({ x, y })
  }

  const dotLeft = value !== null ? ((value.x + 5) / 10) * size : null
  const dotTop  = value !== null ? ((5 - value.y) / 10) * size : null
  const dotColor = value ? getValenceColor(value.x) : null

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    fontSize: '0.6rem',
    color: 'var(--text-muted)',
    userSelect: 'none',
    lineHeight: 1,
    pointerEvents: 'none',
  }

  return (
    <div
      ref={ref}
      onClick={handlePointer}
      style={{
        width: size,
        height: size,
        background: 'var(--bg-subtle)',
        borderRadius: 8,
        position: 'relative',
        cursor: 'crosshair',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        touchAction: 'none',
      }}
    >
      {/* Midlines */}
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--border-focus)', opacity: 0.5 }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border-focus)', opacity: 0.5 }} />

      {/* Corner labels */}
      <span style={{ ...labelStyle, top: 7, left: 7 }}>neg/andere</span>
      <span style={{ ...labelStyle, top: 7, right: 7 }}>pos/andere</span>
      <span style={{ ...labelStyle, bottom: 7, left: 7 }}>neg/ich</span>
      <span style={{ ...labelStyle, bottom: 7, right: 7 }}>pos/ich</span>

      {/* Dot */}
      {dotLeft !== null && dotTop !== null && dotColor && (
        <div
          style={{
            position: 'absolute',
            left: dotLeft - 6,
            top: dotTop - 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 0 3px ${dotColor}33`,
            pointerEvents: 'none',
            transition: 'left 80ms ease, top 80ms ease',
          }}
        />
      )}
    </div>
  )
}
