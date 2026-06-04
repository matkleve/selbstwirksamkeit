'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function MirrorEmptyClose() {
  const router = useRouter()
  return (
    <div className="flex justify-end pt-2">
      <Button type="button" variant="ghost" size="lg" onClick={() => router.push('/')}>
        Schließen
      </Button>
    </div>
  )
}
