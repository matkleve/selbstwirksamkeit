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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--bg-base)' }}>
        <AuthForm />
      </div>
    )
  }

  return (
    <main className="page">
      <div className="page-inner">
        <header className="page-header">
          <h1 className="page-title">Selbstwirksamkeit</h1>
          <Nav />
          <SignOut />
        </header>
        <Banner />
        <EntryCard />
      </div>
    </main>
  )
}
