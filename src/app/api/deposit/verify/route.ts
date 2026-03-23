import { NextResponse } from 'next/server'

export const maxDuration = 45
import { eq, sum, and } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { getConnection } from '@/lib/solana'
import { readPosition } from '@/lib/lulo'
import { db, deposits, packs, users, pendingDeposits } from '@/lib/db'

const USDC_PER_PACK = 20_000_000 // 20 USDC in micro-units

// Check on-chain status once (no retries)
async function checkOnChain(txSignature: string): Promise<boolean> {
  try {
    const { value } = await getConnection().getSignatureStatuses([txSignature], {
      searchTransactionHistory: true,
    })
    const status = value[0]
    return (
      status !== null &&
      status.err === null &&
      (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')
    )
  } catch {
    return false
  }
}

export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const { txSignature, amountUsdc } = body

  if (typeof txSignature !== 'string' || !txSignature) {
    return NextResponse.json({ error: 'txSignature required' }, { status: 400 })
  }
  if (typeof amountUsdc !== 'number' || amountUsdc <= 0) {
    return NextResponse.json({ error: 'amountUsdc required' }, { status: 400 })
  }

  // Idempotency check — UNIQUE constraint on tx_signature prevents double-insert,
  // but we check first to return a clean 409 rather than a DB error
  const existing = await db.select().from(deposits).where(eq(deposits.tx_signature, txSignature))
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Transaction already processed' }, { status: 409 })
  }

  // Ensure user row exists (first deposit may arrive before POST /api/users/me)
  await db.insert(users).values({ wallet_address: walletAddress }).onConflictDoNothing()

  // Record pending deposit immediately so the Helius webhook can pick it up
  // if this function times out before confirming on-chain
  await db.insert(pendingDeposits)
    .values({ wallet_address: walletAddress, tx_signature: txSignature, amount_usdc: amountUsdc })
    .onConflictDoNothing()

  // Get sum of existing confirmed deposits to compute expected Lulo minimum
  const depositResult = await db
    .select({ total: sum(deposits.amount_usdc) })
    .from(deposits)
    .where(eq(deposits.wallet_address, walletAddress))
  const existingTotal = Number(depositResult[0]?.total ?? 0)
  // 5% tolerance covers Lulo fees / rounding
  const expectedMinPosition = existingTotal + Math.floor(amountUsdc * 0.95)

  // Poll both on-chain (Helius) and Lulo in parallel each iteration.
  // Succeed as soon as either source confirms the deposit.
  const MAX_ATTEMPTS = 15
  const DELAY_MS = 2000
  let confirmed = false

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const [onChain, luloPosition] = await Promise.all([
      checkOnChain(txSignature),
      readPosition(walletAddress),
    ])
    if (onChain || luloPosition >= expectedMinPosition) {
      confirmed = true
      break
    }
    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }

  if (!confirmed) {
    return NextResponse.json({ error: 'Deposit not yet reflected. Please try again shortly.' }, { status: 400 })
  }

  // Clean up pending record now that we're confirming
  await db.delete(pendingDeposits).where(eq(pendingDeposits.tx_signature, txSignature))

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

  return NextResponse.json({ deposit, packs: packRows })
})
