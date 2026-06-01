'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, BarChart2, Sparkles, Bell } from 'lucide-react'

const TABS = [
  { href: '/',               label: 'Neu',       Icon: Plus },
  { href: '/dashboard',     label: 'Dashboard', Icon: BarChart2 },
  { href: '/motivation',    label: 'Stärke',    Icon: Sparkles },
  { href: '/notifications', label: 'Erinnern',  Icon: Bell },
]

export default function BottomTabBar() {
  const path = usePathname()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      display: 'flex',
      gap: 8,
      padding: '6px 8px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 999,
      boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
    }}>
      {TABS.map(({ href, label, Icon }) => {
        const active = path === href
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '7px 14px',
              borderRadius: 999,
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              background: active ? 'var(--bg-subtle)' : 'transparent',
              textDecoration: 'none',
              transition: 'color 150ms ease, background 150ms ease',
              minWidth: 56,
            }}
          >
            <Icon size={19} strokeWidth={active ? 2 : 1.5} />
            <span style={{
              fontSize: '0.5625rem',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
