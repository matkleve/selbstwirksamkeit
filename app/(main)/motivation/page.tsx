import { redirect } from 'next/navigation'
import MotivationView from '@/components/MotivationView'
import { getServerUser } from '@/lib/server-entries'

export default async function MotivationPage() {
  if (!(await getServerUser())) redirect('/')
  return <MotivationView />
}
