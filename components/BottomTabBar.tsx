'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, BarChart2, Sparkles, Bell } from 'lucide-react'

const TABS = [
  { href: '/',             label: 'Neu',       Icon: Plus },
  { href: '/dashboard',   label: 'Dashboard', Icon: BarChart2 },
  { href: '/motivation',  label: 'Stärke',    Icon: Sparkles },
  { href: '/notifications', label: 'Erinnern', Icon: Bell },
]

export default function BottomTabBar() {
  const path = usePathname()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {TABS.map(({ href, label, Icon }) => {
        const active = path === href
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '9px 4px 10px',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 150ms ease',
            }}
          >
            <Icon size={21} strokeWidth={active ? 2 : 1.5} />
            <span style={{
              fontSize: '0.625rem',
              fontWeight: active ? 500 : 400,
              letterSpacing: '0.01em',
            }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
