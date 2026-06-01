'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/button'
import { getPasswordChecks, isPasswordValid } from '@/lib/utils'

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2.5 text-[15px] font-inherit outline-none bg-surface text-foreground'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/')
      else setReady(true)
    })
  }, [])

  const checks = getPasswordChecks(password)
  const passwordOk = isPasswordValid(password)
  const showHints = password.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordOk) return
    setSaving(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      await supabase.auth.signOut()
      router.replace('/')
    }
  }

  if (!ready) return null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: 'var(--bg-base)' }}>
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-[380px]">
        <h1 className="text-xl font-medium mb-1">Neues Passwort</h1>
        <p className="text-sm text-muted mb-6">Wähle ein neues Passwort für dein Konto.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Neues Passwort"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            className={inputClass}
            autoFocus
          />

          {showHints && (
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {checks.map(rule => (
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

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <Button type="submit" disabled={!passwordOk || saving} className="w-full">
            {saving ? 'Speichern…' : 'Passwort speichern'}
          </Button>
        </form>
      </div>
    </div>
  )
}
