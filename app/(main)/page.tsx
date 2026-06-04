import { AuthForm } from '@/components/auth-form'
import { EntriesLoadingGate } from '@/components/EntriesLoadingGate'
import EntryCard from '@/components/EntryCard'
import { PageHeader } from '@/components/PageHeader'
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

  return (
    <EntriesLoadingGate>
      <>
        <PageHeader
          title="Neu"
          description="Setze einen Punkt im Stimmungsfeld und schreib auf, was gerade wichtig ist."
        />
        <EntryCard />
      </>
    </EntriesLoadingGate>
  )
}
