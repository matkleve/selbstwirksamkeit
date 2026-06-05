// Standalone test — run with: npx tsx lib/__tests__/embedding.test.ts
import { buildEmbedInput } from '../embedding'

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

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg)
}

console.log('\n── buildEmbedInput ──')

test('ein Klammer-Block pro atomarem Meta-Wert', () => {
  const input = buildEmbedInput({
    id: '1',
    text: 'gelernt',
    person: 'Tom, Anna',
    location: 'Bibliothek',
    body_state: 'tired',
  })
  assert(input === '[Tom][Anna][Bibliothek][müde] gelernt', `bekam: ${input}`)
})

test('leere Meta-Felder werden übersprungen', () => {
  const input = buildEmbedInput({ id: '1', text: 'nur Text', person: null, location: '', activity: null })
  assert(input === 'nur Text', `bekam: ${input}`)
})

console.log(`\n${'─'.repeat(40)}`)
console.log(`Ergebnis: ${passed} bestanden · ${failed} fehlgeschlagen\n`)
if (failed > 0) process.exit(1)
