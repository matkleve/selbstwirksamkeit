import { redirect } from 'next/navigation'
import { EntriesLoadingGate } from '@/components/EntriesLoadingGate'
import TimelineView from '@/components/TimelineView'
import { getServerUser } from '@/lib/server-entries'

export default async function TimelinePage() {
  if (!(await getServerUser())) redirect('/')
  return (
    <EntriesLoadingGate>
      <TimelineView />
    </EntriesLoadingGate>
  )
}
