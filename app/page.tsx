import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AuthForm } from '@/components/auth-form'
import EntryCard from '@/components/EntryCard'
import Nav from '@/components/Nav'
import SignOut from '@/components/SignOut'
import Banner from '@/components/Banner'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: 'var(--bg-base)' }}>
        <AuthForm />
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            Selbstwirksamkeit
          </h1>
          <Nav />
          <SignOut />
        </header>

        <Banner />
        <EntryCard />
      </div>
    </main>
  )
}
