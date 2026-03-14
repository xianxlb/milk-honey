import { Connection, PublicKey, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js'

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

let connectionInstance: Connection | null = null

export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(RPC_URL, 'confirmed')
  }
  return connectionInstance
}

export function getWalletKeypair(): Keypair {
  const secretKey = process.env.WALLET_SECRET_KEY
  if (!secretKey) throw new Error('WALLET_SECRET_KEY not configured')
  const decoded = JSON.parse(secretKey) as number[]
  return Keypair.fromSecretKey(Uint8Array.from(decoded))
}

export function getWalletPublicKey(): PublicKey {
  const pubkey = process.env.NEXT_PUBLIC_WALLET_ADDRESS
  if (!pubkey) throw new Error('NEXT_PUBLIC_WALLET_ADDRESS not configured')
  return new PublicKey(pubkey)
}

export async function sendTransaction(
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  signer: Keypair
): Promise<string> {
  if (transaction instanceof VersionedTransaction) {
    transaction.sign([signer])
    const signature = await connection.sendTransaction(transaction)
    await connection.confirmTransaction(signature, 'confirmed')
    return signature
  }
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  transaction.feePayer = signer.publicKey
  transaction.sign(signer)
  const signature = await connection.sendRawTransaction(transaction.serialize())
  await connection.confirmTransaction(signature, 'confirmed')
  return signature
}
