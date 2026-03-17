import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { verifyTx } from '@/lib/solana'
import { db, deposits, packs, users } from '@/lib/db'

const USDC_PER_PACK = 20_000_000 // 20 USDC in micro-units

export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const { txSignature, amountUsdc } = body

  if (typeof txSignature !== 'string' || !txSignature) {
    return NextResponse.json({ error: 'txSignature required' }, { status: 400 })
  }
  if (typeof amountUsdc !== 'number' || amountUsdc <= 0) {
    return NextResponse.json({ error: 'amountUsdc required' }, { status: 400 })
  }

  const confirmed = await verifyTx(txSignature)
  if (!confirmed) {
    return NextResponse.json({ error: 'Transaction not confirmed on-chain' }, { status: 400 })
  }

  // Idempotency check — UNIQUE constraint on tx_signature prevents double-insert,
  // but we check first to return a clean 409 rather than a DB error
  const existing = await db.select().from(deposits).where(eq(deposits.tx_signature, txSignature))
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Transaction already processed' }, { status: 409 })
  }

  // Ensure user row exists (first deposit may arrive before POST /api/users/me)
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

  return NextResponse.json({ deposit, packs: packRows })
})
