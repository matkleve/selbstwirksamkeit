'use client'

import { Menu, User, Settings, LogOut, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import { NavDropdown } from '@/components/NavDropdown'

export default function MenuDropdown() {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const toggleTheme = () => {
    const html = document.documentElement
    const isDark = html.classList.contains('dark')
    html.classList.toggle('dark', !isDark)
    html.classList.toggle('light', isDark)
    try { localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'light' : 'dark') } catch {}
  }

  return (
    <NavDropdown
      align="right"
      minWidth={190}
      items={[
        { type: 'item', id: 'profile', label: 'Profil', icon: User, onClick: () => {} },
        { type: 'item', id: 'settings', label: 'Einstellungen', icon: Settings, onClick: () => {} },
        { type: 'item', id: 'theme', label: 'Theme wechseln', icon: Moon, onClick: toggleTheme },
        { type: 'separator' },
        { type: 'item', id: 'signout', label: 'Abmelden', icon: LogOut, onClick: handleSignOut, destructive: true },
      ]}
    >
      {({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          data-active={open ? '' : undefined}
          className="nav-interactive nav-interactive--ink flex size-[34px] cursor-pointer items-center justify-center rounded-lg border border-edge"
          aria-label="Menü"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Menu size={17} strokeWidth={1.75} />
        </button>
      )}
    </NavDropdown>
  )
}
