import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AuthForm } from '@/components/auth-form'
import { AppShell } from '@/components/app-shell'
import type { Entry } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <AuthForm />
      </div>
    )
  }

  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <AppShell
      initialEntries={(entries as Entry[]) ?? []}
      user={{ id: user.id, email: user.email }}
    />
  )
}
