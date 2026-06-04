import { createClient } from '@supabase/supabase-js'
import {
  isDueForFire,
  notificationPayloadForIntention,
  sendPushToSubscription,
  type PushSubscriptionRow,
} from '@/lib/push/send-server'
import { INTENTION_REMINDER_MAX_FIRES } from '@/lib/intentionReminderText'

export interface DeliveryResult {
  intentionsChecked: number
  sent: number
  deactivated: number
  errors: string[]
}

type IntentionRow = {
  id: string
  user_id: string
  wenn_text: string
  dann_text: string
  wants_reminder: boolean
  active: boolean
  fired_count: number
  expires_at: string | null
  last_fired_at: string | null
}

export async function deliverIntentionReminders(supabaseUrl: string, serviceKey: string): Promise<DeliveryResult> {
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const result: DeliveryResult = {
    intentionsChecked: 0,
    sent: 0,
    deactivated: 0,
    errors: [],
  }

  const { data: intentions, error } = await supabase
    .from('implementation_intentions')
    .select(
      'id,user_id,wenn_text,dann_text,wants_reminder,active,fired_count,expires_at,last_fired_at',
    )
    .eq('active', true)
    .eq('wants_reminder', true)

  if (error) {
    result.errors.push(error.message)
    return result
  }

  const now = new Date()

  for (const row of (intentions ?? []) as IntentionRow[]) {
    result.intentionsChecked++
    if (!isDueForFire(row, now)) continue

    const payload = notificationPayloadForIntention(row)
    if (!payload) {
      await supabase.from('implementation_intentions').update({ active: false }).eq('id', row.id)
      result.deactivated++
      continue
    }

    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint,p256dh,auth')
      .eq('user_id', row.user_id)

    if (subErr) {
      result.errors.push(subErr.message)
      continue
    }
    if (!subs?.length) continue

    let delivered = false
    for (const sub of subs as PushSubscriptionRow[]) {
      try {
        await sendPushToSubscription(sub, { ...payload, url: '/mirror' })
        delivered = true
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('410') || msg.includes('404')) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        } else {
          result.errors.push(msg)
        }
      }
    }

    if (!delivered) continue

    const nextCount = row.fired_count + 1
    const updates: Partial<IntentionRow> = {
      fired_count: nextCount,
      last_fired_at: now.toISOString(),
    }
    if (nextCount >= INTENTION_REMINDER_MAX_FIRES) {
      updates.active = false
      result.deactivated++
    }

    await supabase.from('implementation_intentions').update(updates).eq('id', row.id)
    result.sent++
  }

  return result
}
