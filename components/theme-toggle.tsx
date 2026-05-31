'use client'

import { useTheme } from '@/components/theme-provider'
import type { Theme } from '@/lib/theme'

const OPTIONS: { value: Theme; label: string; title: string }[] = [
  { value: 'light', label: 'Hell', title: 'Helles Design' },
  { value: 'dark', label: 'Dunkel', title: 'Dunkles Design' },
  { value: 'system', label: 'System', title: 'Systemeinstellung folgen' },
]

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="group"
      aria-label="Farbschema"
      className={`inline-flex rounded-full border border-border p-0.5 bg-surface ${className}`}
    >
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          title={opt.title}
          aria-pressed={theme === opt.value}
          onClick={() => setTheme(opt.value)}
          className={
            theme === opt.value
              ? 'rounded-full px-2.5 py-1 text-[11px] bg-primary text-primary-fg cursor-pointer font-inherit border-0'
              : 'rounded-full px-2.5 py-1 text-[11px] text-muted bg-transparent cursor-pointer font-inherit border-0 hover:text-foreground'
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
