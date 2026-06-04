'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function MirrorEmptyClose({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  return (
    <div className="flex justify-end pt-2">
      <Button
        type="button"
        variant="ghost"
        size="lg"
        onClick={() => (onClose ? onClose() : router.push('/mirror'))}
      >
        Schließen
      </Button>
    </div>
  )
}
