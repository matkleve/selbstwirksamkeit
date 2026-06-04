'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getPasswordChecks, isPasswordValid } from '@/lib/utils'
import { cn } from '@/lib/cn'

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
    <div className="min-h-screen bg-canvas flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm rounded-form bg-card border border-edge shadow-pop p-8">
        <div className="mb-8">
          <h1 className="mb-1">Neues Passwort</h1>
          <p className="text-sm text-ink-2">Wähle ein neues Passwort für dein Konto.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="Neues Passwort"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            error={showHints && !passwordOk}
            autoFocus
            autoComplete="new-password"
          />

          {showHints && (
            <ul className="flex flex-col gap-1.5 -mt-1">
              {checks.map(rule => (
                <li
                  key={rule.id}
                  className={cn('text-xs flex items-center gap-2', rule.met ? 'text-ok' : 'text-ink-3')}
                >
                  <span className="text-[10px]">{rule.met ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-sm text-err">{error}</p>}

          <Button
            type="submit"
            size="lg"
            className="w-full mt-1"
            disabled={!passwordOk || saving}
          >
            {saving ? 'Speichern…' : 'Passwort speichern'}
          </Button>
        </form>
      </div>
    </div>
  )
}
