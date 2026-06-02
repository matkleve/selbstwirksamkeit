import { AppShell } from '@/components/AppShell'
import { getServerUser } from '@/lib/server-entries'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()

  if (!user) return <>{children}</>

  return <AppShell>{children}</AppShell>
}
