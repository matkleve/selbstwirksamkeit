import { AuthForm } from '@/components/auth-form'
import EntryCard from '@/components/EntryCard'
import { getServerUser } from '@/lib/server-entries'

export default async function HomePage() {
  const user = await getServerUser()

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--bg-base)' }}>
        <AuthForm />
      </div>
    )
  }

  return <EntryCard />
}
