import { Connection } from '@solana/web3.js'

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

let _connection: Connection | null = null

export function getConnection(): Connection {
  if (!_connection) _connection = new Connection(RPC_URL, 'confirmed')
  return _connection
}

// Verifies a transaction signature by checking its status on-chain.
// Uses getSignatureStatuses (faster to propagate than getTransaction) with retries.
export async function verifyTx(signature: string): Promise<boolean> {
  const connection = getConnection()
  const MAX_ATTEMPTS = 6
  const DELAY_MS = 2000

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const { value } = await connection.getSignatureStatuses([signature], {
        searchTransactionHistory: true,
      })
      const status = value[0]
      if (status !== null && status.err === null &&
        (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) {
        return true
      }
    } catch {
      // RPC error — try again
    }
    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }
  return false
}
