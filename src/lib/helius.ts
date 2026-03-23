const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? ''
const HELIUS_BASE = 'https://api.helius.xyz/v0'

// Adds a wallet address to the Helius webhook's watched accounts.
// Safe to call on every new user registration — deduplicates server-side.
export async function addWalletToWebhook(walletAddress: string): Promise<void> {
  const webhookId = process.env.HELIUS_WEBHOOK_ID
  if (!HELIUS_API_KEY || !webhookId) return

  try {
    // Get current webhook config
    const getRes = await fetch(`${HELIUS_BASE}/webhooks/${webhookId}?api-key=${HELIUS_API_KEY}`)
    if (!getRes.ok) return
    const webhook = await getRes.json()

    const existing: string[] = webhook.accountAddresses ?? []
    if (existing.includes(walletAddress)) return

    // Add the new wallet
    await fetch(`${HELIUS_BASE}/webhooks/${webhookId}?api-key=${HELIUS_API_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...webhook,
        accountAddresses: [...existing, walletAddress],
      }),
    })
  } catch {
    // Non-fatal — webhook is a best-effort safety net
  }
}
