'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, User, Settings, LogOut, Moon, Sun } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { THEME_STORAGE_KEY } from '@/lib/theme'

export default function MenuDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const handleSignOut = async () => {
    setOpen(false)
    await supabase.auth.signOut()
    router.refresh()
  }

  const toggleTheme = () => {
    const html = document.documentElement
    const isDark = html.classList.contains('dark')
    html.classList.toggle('dark', !isDark)
    html.classList.toggle('light', isDark)
    try { localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'light' : 'dark') } catch {}
    setOpen(false)
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '10px 14px',
    fontSize: '0.875rem', color: 'var(--text-primary)',
    background: 'transparent', border: 'none',
    cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 100ms ease',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 34, height: 34,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: open ? 'var(--bg-subtle)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          transition: 'all 150ms ease',
        }}
        aria-label="Menü"
      >
        <Menu size={17} strokeWidth={1.75} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-pop)',
          minWidth: 190,
          overflow: 'hidden',
          zIndex: 200,
        }}>
          <button style={itemStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-subtle)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')} onClick={() => setOpen(false)}>
            <User size={15} strokeWidth={1.5} /> Profil
          </button>
          <button style={itemStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-subtle)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')} onClick={() => setOpen(false)}>
            <Settings size={15} strokeWidth={1.5} /> Einstellungen
          </button>
          <button style={itemStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-subtle)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')} onClick={toggleTheme}>
            <span style={{ display: 'flex' }}><Moon size={15} strokeWidth={1.5} /></span> Theme wechseln
          </button>
          <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
          <button
            style={{ ...itemStyle, color: 'var(--danger)' }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            onClick={handleSignOut}
          >
            <LogOut size={15} strokeWidth={1.5} /> Abmelden
          </button>
        </div>
      )}
    </div>
  )
}
