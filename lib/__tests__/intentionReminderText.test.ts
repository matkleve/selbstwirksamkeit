import {
  intentionNotificationText,
  intentionExpiresAt,
  shouldSendIntentionReminder,
  INTENTION_REMINDER_MAX_FIRES,
} from '../intentionReminderText'

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✓  ${name}`)
    passed++
  } catch (e: unknown) {
    console.error(`  ✗  ${name}`)
    console.error(`     ${(e as Error).message}`)
    failed++
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

console.log('\n── intentionNotificationText ──')

test('Tag 1: WENN + DANN, zwei Zeilen', () => {
  const t = intentionNotificationText('es 21 Uhr wird', 'atme ich dreimal durch', 0)
  assert(t === 'Wenn es 21 Uhr wird —\natme ich dreimal durch.', `got: ${JSON.stringify(t)}`)
})

test('Tag 2–3: nur DANN', () => {
  assert(
    intentionNotificationText('es 21 Uhr wird', 'atme ich dreimal durch', 1) ===
      'atme ich dreimal durch.',
  )
  assert(
    intentionNotificationText('es 21 Uhr wird', 'atme ich dreimal durch', 2) ===
      'atme ich dreimal durch.',
  )
})

test('Tag 4+: null', () => {
  assert(intentionNotificationText('a', 'b', INTENTION_REMINDER_MAX_FIRES) === null)
})

test('shouldSend false after max fires', () => {
  assert(
    !shouldSendIntentionReminder({
      wenn_text: 'x',
      dann_text: 'y',
      wants_reminder: true,
      active: true,
      fired_count: 3,
      expires_at: null,
    }),
  )
})

test('shouldSend false after expires_at', () => {
  assert(
    !shouldSendIntentionReminder(
      {
        wenn_text: 'x',
        dann_text: 'y',
        wants_reminder: true,
        active: true,
        fired_count: 0,
        expires_at: '2020-01-01T00:00:00.000Z',
      },
      new Date('2026-01-01'),
    ),
  )
})

console.log(`\n${'─'.repeat(40)}`)
console.log(`Ergebnis: ${passed} bestanden · ${failed} fehlgeschlagen\n`)
if (failed > 0) process.exit(1)
