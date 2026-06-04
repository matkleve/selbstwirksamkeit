'use client'

import { useEffect } from 'react'
import { isPushSupported, registerPushSubscription } from '@/lib/push/subscribe-client'

/** Re-sync push subscription when user already granted permission (e.g. after PWA install). */
export function PushRegistrar() {
  useEffect(() => {
    if (!isPushSupported()) return
    if (Notification.permission !== 'granted') return
    void registerPushSubscription()
  }, [])

  return null
}
