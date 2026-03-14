const LULO_API_KEY = process.env.LULO_API_KEY ?? ''
// ⚠️ Verify this URL and the request body shape against dev.lulo.fi before use
const LULO_DEPOSIT_URL = 'https://api.lulo.fi/v1/generate.transactions.deposit'
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

export async function generateDepositTx({
  walletAddress,
  amountUsdc,
}: {
  walletAddress: string
  amountUsdc: number
}): Promise<string> {
  const res = await fetch(LULO_DEPOSIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': LULO_API_KEY },
    // ⚠️ Verify these field names against dev.lulo.fi
    body: JSON.stringify({ owner: walletAddress, mintAddress: USDC_MINT, regularAmount: amountUsdc }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Lulo API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  // ⚠️ Verify the response field name ('transaction', 'tx', 'data', etc.) against dev.lulo.fi
  return data.transaction as string
}

// Returns total Lulo position value for wallet in USDC micro-units.
// ⚠️ Implement based on dev.lulo.fi docs — use API endpoint or on-chain PDA read.
// Returns 0 on error so portfolio degrades gracefully (yield shows as 0, not a crash).
export async function readPosition(walletAddress: string): Promise<number> {
  // Replace this stub with the real implementation from dev.lulo.fi
  // Option A (REST): fetch(`https://api.lulo.fi/v1/accounts/${walletAddress}`, { headers: { 'x-api-key': LULO_API_KEY } })
  // Option B (on-chain PDA): see docs.lulo.fi/integration-guide for seed derivation
  try {
    // Stub — replace with real call
    throw new Error('readPosition not yet implemented')
  } catch {
    return 0
  }
}
