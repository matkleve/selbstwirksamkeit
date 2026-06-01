import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AppShell } from '@/components/AppShell'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <>{children}</>

  return <AppShell>{children}</AppShell>
}
