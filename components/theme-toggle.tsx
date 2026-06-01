'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/components/theme-provider'
import type { Theme } from '@/lib/theme'

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light',  label: 'Hell' },
  { value: 'dark',   label: 'Dunkel' },
  { value: 'system', label: 'System' },
]

function ThemeIcon({ resolved }: { resolved: 'light' | 'dark' }) {
  if (resolved === 'dark') {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
        <path d="M7.5 1.5a6 6 0 1 0 6 6 4.5 4.5 0 0 1-6-6Z" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <circle cx="7.5" cy="7.5" r="2.5" fill="currentColor" />
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.1 3.1l1.06 1.06M10.84 10.84l1.06 1.06M3.1 11.9l1.06-1.06M10.84 4.16l1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, resolved, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }} className={className}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Farbschema"
        aria-label="Farbschema wählen"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <ThemeIcon resolved={resolved} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-card)',
          minWidth: 110,
          overflow: 'hidden',
          zIndex: 50,
        }}>
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setTheme(opt.value); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 14px',
                textAlign: 'left',
                background: theme === opt.value ? 'var(--bg-subtle)' : 'transparent',
                color: theme === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: theme === opt.value ? 500 : 400,
                fontSize: '0.875rem',
                fontFamily: 'var(--font-body)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
