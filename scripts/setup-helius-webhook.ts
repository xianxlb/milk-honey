/**
 * One-time script to register the Helius webhook.
 * Run with: npx tsx scripts/setup-helius-webhook.ts
 *
 * After running, add HELIUS_WEBHOOK_ID and HELIUS_WEBHOOK_SECRET to .env.local and Vercel.
 */
import crypto from 'crypto'

const HELIUS_API_KEY = process.env.HELIUS_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://milk-honey.vercel.app'

if (!HELIUS_API_KEY) {
  console.error('HELIUS_API_KEY not set')
  process.exit(1)
}

const webhookSecret = crypto.randomBytes(32).toString('hex')
const webhookURL = `${APP_URL}/api/webhooks/helius`

const res = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    webhookURL,
    transactionTypes: ['TOKEN_TRANSFER'],
    accountAddresses: [], // wallets added dynamically via addWalletToWebhook()
    webhookType: 'enhanced',
    authHeader: webhookSecret,
  }),
})

if (!res.ok) {
  const text = await res.text()
  console.error('Failed to register webhook:', text)
  process.exit(1)
}

const data = await res.json()
console.log('\n✅ Helius webhook registered!\n')
console.log(`HELIUS_WEBHOOK_ID=${data.webhookID}`)
console.log(`HELIUS_WEBHOOK_SECRET=${webhookSecret}`)
console.log('\nAdd both to .env.local and to Vercel environment variables.')
