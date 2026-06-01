'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/button'
import { getPasswordChecks, isPasswordValid } from '@/lib/utils'

type Mode = 'login' | 'signup' | 'reset'

export function AuthForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [authError, setAuthError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const passwordChecks = getPasswordChecks(password)
  const passwordOk = isPasswordValid(password)
  const showPasswordHints = mode === 'signup' && password.length > 0

  function switchMode(next: Mode) {
    setMode(next)
    setAuthError('')
    setResetSent(false)
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')

    if (mode === 'reset') {
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) setAuthError(error.message)
      else setResetSent(true)
      return
    }

    if (mode === 'signup' && !passwordOk) {
      setAuthError('Bitte erfülle alle Passwort-Anforderungen.')
      return
    }

    const fn =
      mode === 'login'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password })
    const { error } = await fn
    if (error) setAuthError(error.message)
    else router.refresh()
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      padding: '32px 28px',
      width: '100%',
      maxWidth: 400,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display), Georgia, serif',
            fontSize: '1.625rem',
            fontWeight: 400,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            marginBottom: 6,
          }}>
            Selbstwirksamkeit
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Dein persönliches Tagebuch
          </p>
        </div>
        <ThemeToggle />
      </div>

      {mode === 'reset' && resetSent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            ✓ Link gesendet. Schau in dein Postfach und klicke auf den Link zum Zurücksetzen.
          </p>
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
          >
            ← Zurück zum Anmelden
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          {mode !== 'reset' && (
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError('') }}
              style={showPasswordHints && !passwordOk ? { borderColor: 'var(--border-focus)' } : undefined}
            />
          )}

          {showPasswordHints && (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, padding: 0 }}>
              {passwordChecks.map(rule => (
                <li key={rule.id} style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6, color: rule.met ? 'var(--hint-ok)' : 'var(--text-muted)' }}>
                  <span style={{ fontSize: '0.6875rem' }}>{rule.met ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          {authError && (
            <p style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{authError}</p>
          )}

          <Button type="submit" disabled={mode === 'signup' && !passwordOk} className="w-full" style={{ marginTop: 4 }}>
            {mode === 'login' ? 'Anmelden' : mode === 'signup' ? 'Registrieren' : 'Reset-Link senden'}
          </Button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
              >
                Passwort vergessen?
              </button>
            )}
            {mode !== 'reset' ? (
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
              >
                {mode === 'login' ? 'Noch kein Konto? Registrieren →' : 'Bereits registriert? Anmelden →'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
              >
                ← Zurück zum Anmelden
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
