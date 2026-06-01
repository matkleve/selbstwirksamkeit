'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getPasswordChecks, isPasswordValid } from '@/lib/utils'
import { cn } from '@/lib/cn'

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
    <div className="w-full max-w-sm rounded-form bg-card border border-edge shadow-pop p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl text-ink leading-tight">
            Selbstwirksamkeit
          </h1>
          <p className="text-sm text-ink-2">Dein persönliches Tagebuch</p>
        </div>
        <ThemeToggle />
      </div>

      {mode === 'reset' && resetSent ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink leading-relaxed">
            ✓ Link gesendet. Schau in dein Postfach und klicke auf den Link zum Zurücksetzen.
          </p>
          <Button variant="link" size="sm" onClick={() => switchMode('login')}>
            ← Zurück zum Anmelden
          </Button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />

          {mode !== 'reset' && (
            <Input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError('') }}
              error={showPasswordHints && !passwordOk}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          )}

          {showPasswordHints && (
            <ul className="flex flex-col gap-1.5 -mt-1">
              {passwordChecks.map(rule => (
                <li
                  key={rule.id}
                  className={cn(
                    'text-xs flex items-center gap-2',
                    rule.met ? 'text-ok' : 'text-ink-3'
                  )}
                >
                  <span className="text-[10px]">{rule.met ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          {authError && (
            <p className="text-sm text-err">{authError}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full mt-1"
            disabled={mode === 'signup' && !passwordOk}
          >
            {mode === 'login' ? 'Anmelden' : mode === 'signup' ? 'Registrieren' : 'Reset-Link senden'}
          </Button>

          <div className="flex flex-col gap-2 pt-1">
            {mode === 'login' && (
              <Button variant="link" size="sm" type="button" onClick={() => switchMode('reset')}>
                Passwort vergessen?
              </Button>
            )}
            {mode !== 'reset' ? (
              <Button
                variant="link"
                size="sm"
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              >
                {mode === 'login'
                  ? 'Noch kein Konto? Registrieren →'
                  : 'Bereits registriert? Anmelden →'}
              </Button>
            ) : (
              <Button variant="link" size="sm" type="button" onClick={() => switchMode('login')}>
                ← Zurück zum Anmelden
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
