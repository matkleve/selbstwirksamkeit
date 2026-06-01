import { redirect } from 'next/navigation'
import DashboardView from '@/components/DashboardView'
import { getServerUser } from '@/lib/server-entries'

export default async function DashboardPage() {
  if (!(await getServerUser())) redirect('/')
  return <DashboardView />
}
