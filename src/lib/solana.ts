import { Connection } from '@solana/web3.js'

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

let _connection: Connection | null = null

export function getConnection(): Connection {
  if (!_connection) _connection = new Connection(RPC_URL, 'confirmed')
  return _connection
}

// Verifies a transaction signature by fetching it from the chain.
// Uses getTransaction (not confirmTransaction) to handle already-confirmed txs correctly.
export async function verifyTx(signature: string): Promise<boolean> {
  const connection = getConnection()
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    })
    return tx !== null && tx.meta?.err === null
  } catch {
    return false
  }
}
