'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, BarChart2, Sparkles, Bell, Eye } from 'lucide-react'
import { cn } from '@/lib/cn'

const TABS = [
  { href: '/', label: 'Neu', Icon: Plus },
  { href: '/dashboard', label: 'Dashboard', Icon: BarChart2 },
  { href: '/mirror', label: 'Spiegel', Icon: Eye, accent: 'mirror' as const },
  { href: '/motivation', label: 'Stärke', Icon: Sparkles },
  { href: '/notifications', label: 'Erinnern', Icon: Bell },
] as const

export default function BottomTabBar() {
  const path = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-[max(20px,env(safe-area-inset-bottom,20px))] left-1/2 z-50 flex -translate-x-1/2 gap-2',
        'rounded-full border border-edge bg-card p-1.5',
        'shadow-[0_4px_24px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.08)]',
      )}
      aria-label="Hauptnavigation"
    >
      {TABS.map(({ href, label, Icon, ...rest }) => {
        const active = path === href
        const mirrorAccent = 'accent' in rest && rest.accent === 'mirror' && active
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={cn(
              'flex min-w-14 flex-col items-center justify-center gap-0.5 rounded-full px-3.5 py-1.5',
              'no-underline transition-[color,background-color] duration-150',
              active ? 'bg-subtle text-ink' : 'bg-transparent text-ink-3',
            )}
            style={mirrorAccent ? { color: 'var(--mirror-gold)' } : undefined}
          >
            <Icon size={19} strokeWidth={active ? 2 : 1.5} />
            <span
              className={cn(
                'text-[0.5625rem] uppercase tracking-wide',
                active ? 'font-semibold' : 'font-normal',
              )}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
