import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, withdrawals } from '@/lib/db'
import { readPosition } from '@/lib/lulo'

export const maxDuration = 30

// Called after the user has signed and broadcast the Lulo initiate-withdraw transaction.
// Validates the amount, checks for a duplicate pending withdrawal, and persists the record.
//
// Body: { txSignature: string, amountUsdc: number }
export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const { txSignature, amountUsdc } = body

  if (typeof txSignature !== 'string' || !txSignature) {
    return NextResponse.json({ error: 'txSignature required' }, { status: 400 })
  }
  if (typeof amountUsdc !== 'number' || amountUsdc <= 0) {
    return NextResponse.json({ error: 'amountUsdc required' }, { status: 400 })
  }

  // Idempotency: if a pending row already exists for this wallet, return 409.
  // The DB partial unique index (WHERE status = 'pending') also enforces this,
  // but we check first to return a clean error rather than a DB constraint violation.
  const existing = await db.select()
    .from(withdrawals)
    .where(and(eq(withdrawals.wallet_address, walletAddress), eq(withdrawals.status, 'pending')))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Withdrawal already in progress' }, { status: 409 })
  }

  // Verify the requested amount doesn't exceed the current Lulo position.
  const position = await readPosition(walletAddress)
  if (amountUsdc > position) {
    return NextResponse.json({ error: 'Amount exceeds current balance' }, { status: 400 })
  }

  const [withdrawal] = await db.insert(withdrawals)
    .values({
      wallet_address: walletAddress,
      amount_usdc: amountUsdc,
      status: 'pending',
      initiated_tx: txSignature,
    })
    .returning()

  return NextResponse.json(withdrawal)
})
