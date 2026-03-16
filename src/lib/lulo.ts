import { USDC_MINT } from '@/lib/constants'

const LULO_API_KEY = process.env.LULO_API_KEY ?? ''
const LULO_BASE_URL = 'https://api.lulo.fi/v1'

export async function generateDepositTx({
  walletAddress,
  amountUsdc,
}: {
  walletAddress: string
  amountUsdc: number
}): Promise<string> {
  // Lulo API expects whole USDC (e.g. 100 = $100), not micro-units
  const res = await fetch(`${LULO_BASE_URL}/generate.transactions.deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': LULO_API_KEY },
    body: JSON.stringify({
      owner: walletAddress,
      mintAddress: USDC_MINT,
      regularAmount: amountUsdc / 1_000_000,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Lulo API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.transaction as string
}

// Returns total Lulo position value for wallet in USDC micro-units.
// Returns 0 on error so portfolio degrades gracefully (yield shows as $0, not a crash).
export async function readPosition(walletAddress: string): Promise<number> {
  try {
    const res = await fetch(
      `${LULO_BASE_URL}/account.getAccount?owner=${walletAddress}`,
      { headers: { 'x-api-key': LULO_API_KEY } },
    )
    if (!res.ok) return 0
    const data = await res.json()
    // totalUsdValue is in whole USD; convert to micro-units for internal consistency
    return Math.round((data.totalUsdValue as number) * 1_000_000)
  } catch {
    return 0
  }
}
