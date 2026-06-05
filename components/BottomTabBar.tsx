'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, BarChart2, Sparkles, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavTabLabel } from '@/components/NavTabLabel'
import { cn } from '@/lib/cn'

const TABS = [
  { href: '/', label: 'Neu', Icon: Plus },
  { href: '/dashboard', label: 'Dashboard', Icon: BarChart2 },
  { href: '/mirror', label: 'Spiegel', Icon: Eye },
  { href: '/motivation', label: 'Stärke', Icon: Sparkles },
] as const

const TAB_WIDTH = 'w-[4.75rem]' as const

function useKeyboardOpen() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let maxHeight = vv.height
    const handler = () => {
      maxHeight = Math.max(maxHeight, vv.height)
      setOpen(vv.height < maxHeight * 0.8)
    }
    vv.addEventListener('resize', handler)
    return () => vv.removeEventListener('resize', handler)
  }, [])
  return open
}

export default function BottomTabBar() {
  const path = usePathname()
  const keyboardOpen = useKeyboardOpen()

  if (keyboardOpen) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[max(20px,env(safe-area-inset-bottom,20px))] z-50 flex justify-center"
      aria-hidden
    >
      <nav
        className={cn(
          'pointer-events-auto flex gap-2',
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
              'nav-interactive flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5',
              TAB_WIDTH,
              'no-underline',
            )}
          >
            <Icon size={19} strokeWidth={1.75} />
            <NavTabLabel label={label} active={active} />
          </Link>
        )
      })}
      </nav>
    </div>
  )
}
