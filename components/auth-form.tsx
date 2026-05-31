'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/button'
import { getPasswordChecks, isPasswordValid } from '@/lib/utils'

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2.5 text-[15px] font-inherit outline-none bg-surface text-foreground'

export function AuthForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authError, setAuthError] = useState('')

  const passwordChecks = getPasswordChecks(password)
  const passwordOk = isPasswordValid(password)
  const showPasswordHints = authMode === 'signup' && password.length > 0

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    if (authMode === 'signup' && !passwordOk) {
      setAuthError('Bitte erfülle alle Passwort-Anforderungen.')
      return
    }
    const fn =
      authMode === 'login'
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
      <form onSubmit={handleAuth} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={e => { setPassword(e.target.value); setAuthError('') }}
          className={`${inputClass} ${showPasswordHints && !passwordOk ? 'border-[var(--hint-warn-border)]' : ''}`}
          aria-describedby={showPasswordHints ? 'password-hints' : undefined}
        />
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
          disabled={authMode === 'signup' && !passwordOk}
          className="w-full"
        >
          {authMode === 'login' ? 'Anmelden' : 'Registrieren'}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => { setAuthMode(m => m === 'login' ? 'signup' : 'login'); setAuthError('') }}
        className="mt-4 text-[13px] text-muted bg-transparent border-0 cursor-pointer p-0"
      >
        {authMode === 'login' ? 'Noch kein Konto? Registrieren →' : 'Bereits registriert? Anmelden →'}
      </button>
    </div>
  )
}
