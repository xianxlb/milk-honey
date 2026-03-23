import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, deposits, packs, users, pendingDeposits } from '@/lib/db'
import { USDC_MINT } from '@/lib/constants'

export const maxDuration = 30

const USDC_PER_PACK = 20_000_000

// Helius sends an Authorization header with the webhook secret
function verifyAuth(req: NextRequest): boolean {
  const secret = process.env.HELIUS_WEBHOOK_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  return auth === secret
}

type HeliusTokenTransfer = {
  fromUserAccount: string
  toUserAccount: string
  tokenAmount: number
  mint: string
}

type HeliusTransaction = {
  signature: string
  tokenTransfers?: HeliusTokenTransfer[]
}

async function creditDeposit(walletAddress: string, txSignature: string, amountUsdc: number) {
  // Idempotency: skip if already credited
  const existing = await db.select().from(deposits).where(eq(deposits.tx_signature, txSignature))
  if (existing.length > 0) return { alreadyCredited: true }

  await db.insert(users).values({ wallet_address: walletAddress }).onConflictDoNothing()

  const [deposit] = await db.insert(deposits)
    .values({ wallet_address: walletAddress, tx_signature: txSignature, amount_usdc: amountUsdc })
    .returning()

  const numPacks = Math.floor(amountUsdc / USDC_PER_PACK)
  const packRows = await Promise.all(
    Array.from({ length: numPacks }, () =>
      db.insert(packs)
        .values({ wallet_address: walletAddress, deposit_id: deposit.id })
        .returning()
        .then(([p]) => p)
    )
  )

  // Clean up pending record
  await db.delete(pendingDeposits).where(eq(pendingDeposits.tx_signature, txSignature))

  return { deposit, packs: packRows }
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let transactions: HeliusTransaction[]
  try {
    transactions = await req.json()
    if (!Array.isArray(transactions)) transactions = [transactions]
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  for (const tx of transactions) {
    const { signature, tokenTransfers = [] } = tx

    // Find USDC transfers and match against pending deposits
    for (const transfer of tokenTransfers) {
      if (transfer.mint !== USDC_MINT || transfer.tokenAmount <= 0) continue

      // Check if this tx matches a pending deposit
      const [pending] = await db.select()
        .from(pendingDeposits)
        .where(eq(pendingDeposits.tx_signature, signature))

      if (pending) {
        await creditDeposit(pending.wallet_address, signature, pending.amount_usdc)
        break
      }

      // No pending record — could be a direct transfer to a known user wallet
      // Credit the recipient if they're a known user
      const [knownUser] = await db.select()
        .from(users)
        .where(eq(users.wallet_address, transfer.toUserAccount))

      if (knownUser) {
        await creditDeposit(transfer.toUserAccount, signature, transfer.tokenAmount)
        break
      }
    }
  }

  return NextResponse.json({ ok: true })
}
