#!/usr/bin/env node
/** Print VAPID key pair for .env.local — run once: node scripts/generate-vapid-keys.mjs */
import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
console.log('\nAdd to .env.local:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`CRON_SECRET=${crypto.randomUUID()}\n`)
