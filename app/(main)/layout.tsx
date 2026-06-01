import { AppShell } from '@/components/AppShell'
import { getServerEntries, getServerUser } from '@/lib/server-entries'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()

  if (!user) return <>{children}</>

  const entries = await getServerEntries()

  return <AppShell initialEntries={entries}>{children}</AppShell>
}
