import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AuthForm } from '@/components/auth-form'
import { AppShell } from '@/components/AppShell'
import EntryCard from '@/components/EntryCard'
import Banner from '@/components/Banner'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--bg-base)' }}>
        <AuthForm />
      </div>
    )
  }

  return (
    <AppShell>
      <Banner />
      <EntryCard />
    </AppShell>
  )
}
