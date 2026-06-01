'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignOut() {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <button onClick={handleSignOut} className="btn-ghost" style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
      Abmelden
    </button>
  )
}
