'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, BarChart2, Sparkles, Eye } from 'lucide-react'
import { NavTabLabel } from '@/components/NavTabLabel'
import { cn } from '@/lib/cn'

const TABS = [
  { href: '/', label: 'Neu', Icon: Plus },
  { href: '/dashboard', label: 'Dashboard', Icon: BarChart2 },
  { href: '/mirror', label: 'Spiegel', Icon: Eye },
  { href: '/motivation', label: 'Stärke', Icon: Sparkles },
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
      {TABS.map(({ href, label, Icon }) => {
        const active = path === href
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            data-active={active ? '' : undefined}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'nav-interactive flex min-w-14 flex-col items-center justify-center gap-0.5 rounded-full px-3.5 py-1.5',
              'no-underline',
            )}
          >
            <Icon size={19} strokeWidth={1.75} />
            <NavTabLabel label={label} active={active} />
          </Link>
        )
      })}
    </nav>
  )
}
