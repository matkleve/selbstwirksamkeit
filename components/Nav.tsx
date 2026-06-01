'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Eintragen' },
  { href: '/timeline', label: 'Verlauf' },
  { href: '/dashboard', label: 'Übersicht' },
]

export default function Nav() {
  const path = usePathname()

  return (
    <nav style={{
      display: 'flex',
      gap: 2,
      padding: 3,
      background: 'var(--bg-subtle)',
      borderRadius: 10,
      border: '1px solid var(--border)',
    }}>
      {links.map(link => {
        const active = path === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              fontSize: '0.8125rem',
              fontWeight: active ? 500 : 400,
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: active ? 'var(--bg-card)' : 'transparent',
              boxShadow: active ? 'var(--shadow-card)' : 'none',
              textDecoration: 'none',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
