'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/cn'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolved, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolved === 'dark'

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? 'Helles Farbschema' : 'Dunkles Farbschema'}
      aria-label={isDark ? 'Zu hellem Farbschema wechseln' : 'Zu dunklem Farbschema wechseln'}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-transparent',
        'text-ink-2 transition-colors',
        'hover:border-[var(--field-border-hover)] hover:bg-subtle hover:text-ink',
        className,
      )}
    >
      {mounted ? (
        isDark ? (
          <Sun size={15} strokeWidth={1.75} aria-hidden />
        ) : (
          <Moon size={15} strokeWidth={1.75} aria-hidden />
        )
      ) : (
        <span className="size-[15px]" aria-hidden />
      )}
    </button>
  )
}
