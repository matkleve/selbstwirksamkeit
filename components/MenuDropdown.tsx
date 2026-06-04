'use client'

import { useRef, useState } from 'react'
import { Menu, User, Settings, LogOut, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import { DropdownPanel, useClickOutside } from '@/components/DropdownPanel'

export default function MenuDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useClickOutside(ref, () => setOpen(false), open)

  const close = () => setOpen(false)

  const handleSignOut = async () => {
    close()
    await supabase.auth.signOut()
    router.refresh()
  }

  const toggleTheme = () => {
    const html = document.documentElement
    const isDark = html.classList.contains('dark')
    html.classList.toggle('dark', !isDark)
    html.classList.toggle('light', isDark)
    try { localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'light' : 'dark') } catch {}
    close()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        data-active={open ? '' : undefined}
        className="nav-interactive nav-interactive--ink flex size-[34px] cursor-pointer items-center justify-center rounded-lg border border-edge"
        aria-label="Menü"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Menu size={17} strokeWidth={1.75} />
      </button>

      {open && (
        <DropdownPanel
          align="right"
          minWidth={190}
          itemTone="nav"
          items={[
            { type: 'item', id: 'profile', label: 'Profil', icon: User, onClick: close },
            { type: 'item', id: 'settings', label: 'Einstellungen', icon: Settings, onClick: close },
            { type: 'item', id: 'theme', label: 'Theme wechseln', icon: Moon, onClick: toggleTheme },
            { type: 'separator' },
            { type: 'item', id: 'signout', label: 'Abmelden', icon: LogOut, onClick: handleSignOut, destructive: true },
          ]}
        />
      )}
    </div>
  )
}
