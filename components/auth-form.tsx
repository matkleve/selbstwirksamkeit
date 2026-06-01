'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/button'
import { getPasswordChecks, isPasswordValid } from '@/lib/utils'

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2.5 text-[15px] font-inherit outline-none bg-surface text-foreground'

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
    <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-[380px] relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-xl font-medium mb-1 pr-24">Selbstwirksamkeit</h1>
      <p className="text-sm text-muted mb-6">Dein persönliches Erfolgs-Journal</p>

      {mode === 'reset' && resetSent ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-foreground">
            ✓ Link gesendet. Schau in dein Postfach und klicke auf den Link zum Zurücksetzen.
          </p>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="text-[13px] text-muted bg-transparent border-0 cursor-pointer p-0 text-left"
          >
            ← Zurück zum Anmelden
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
          />

          {mode !== 'reset' && (
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError('') }}
              className={`${inputClass} ${showPasswordHints && !passwordOk ? 'border-[var(--hint-warn-border)]' : ''}`}
              aria-describedby={showPasswordHints ? 'password-hints' : undefined}
            />
          )}

          {showPasswordHints && (
            <ul id="password-hints" className="m-0 p-0 list-none flex flex-col gap-1">
              {passwordChecks.map(rule => (
                <li
                  key={rule.id}
                  className={`text-xs flex items-center gap-1.5 ${rule.met ? 'text-hint-ok' : 'text-muted'}`}
                >
                  <span aria-hidden className="text-[11px]">{rule.met ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          {authError && <p className="text-[13px] text-danger">{authError}</p>}

          <Button
            type="submit"
            disabled={mode === 'signup' && !passwordOk}
            className="w-full"
          >
            {mode === 'login' ? 'Anmelden' : mode === 'signup' ? 'Registrieren' : 'Reset-Link senden'}
          </Button>

          <div className="flex flex-col gap-2 mt-1">
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-[13px] text-muted bg-transparent border-0 cursor-pointer p-0 text-left"
              >
                Passwort vergessen?
              </button>
            )}
            {mode !== 'reset' ? (
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[13px] text-muted bg-transparent border-0 cursor-pointer p-0 text-left"
              >
                {mode === 'login' ? 'Noch kein Konto? Registrieren →' : 'Bereits registriert? Anmelden →'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[13px] text-muted bg-transparent border-0 cursor-pointer p-0 text-left"
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
