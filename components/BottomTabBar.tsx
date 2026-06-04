'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, BarChart2, Sparkles, Bell, Eye } from 'lucide-react'

const TABS = [
  { href: '/',               label: 'Neu',     Icon: Plus },
  { href: '/mirror',         label: 'Spiegel', Icon: Eye },
  { href: '/dashboard',     label: 'Daten',   Icon: BarChart2 },
  { href: '/motivation',    label: 'Stärke',  Icon: Sparkles },
  { href: '/notifications', label: 'Erinnern',Icon: Bell },
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
      gap: 4,
      padding: '5px 6px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 999,
      boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
    }}>
      {TABS.map(({ href, label, Icon }) => {
        const active = path === href
        const isMirror = href === '/mirror'
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
              padding: '6px 11px',
              borderRadius: 999,
              color: active
                ? isMirror ? 'var(--mirror-gold)' : 'var(--text-primary)'
                : 'var(--text-muted)',
              background: active ? 'var(--bg-subtle)' : 'transparent',
              textDecoration: 'none',
              transition: 'color 150ms ease, background 150ms ease',
              minWidth: 48,
            }}
          >
            <Icon size={18} strokeWidth={active ? 2 : 1.5} />
            <span style={{
              fontSize: '0.5rem',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.03em',
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
