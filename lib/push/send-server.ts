import webpush from 'web-push'
import {
  intentionNotificationText,
  type IntentionReminderRow,
} from '@/lib/intentionReminderText'

const VAPID_SUBJECT = 'mailto:hello@selbstwirksamkeit.app'

let configured = false

function ensureVapid() {
  if (configured) return
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys missing (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)')
  }
  webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey)
  configured = true
}

export interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushToSubscription(
  sub: PushSubscriptionRow,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  ensureVapid()
  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? '/mirror',
    }),
  )
}

/** Min hours between reminder fires for the same intention. */
export const MIN_HOURS_BETWEEN_FIRES = 20

export function isDueForFire(intention: IntentionReminderRow, now = new Date()): boolean {
  if (!intention.wants_reminder || !intention.active) return false
  if (intention.fired_count >= 3) return false
  if (intention.expires_at && new Date(intention.expires_at) < now) return false
  if (intentionNotificationText(intention.wenn_text, intention.dann_text, intention.fired_count) === null) {
    return false
  }
  const last = intention.last_fired_at
  if (!last) return true
  const elapsed = now.getTime() - new Date(last).getTime()
  return elapsed >= MIN_HOURS_BETWEEN_FIRES * 60 * 60 * 1000
}

export function notificationPayloadForIntention(
  intention: Pick<IntentionReminderRow, 'wenn_text' | 'dann_text' | 'fired_count'>,
): { title: string; body: string } | null {
  const body = intentionNotificationText(
    intention.wenn_text,
    intention.dann_text,
    intention.fired_count,
  )
  if (!body) return null
  const title = 'Selbstwirksamkeit'
  return { title, body }
}
