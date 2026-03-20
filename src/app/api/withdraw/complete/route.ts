import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, withdrawals } from '@/lib/db'

export const maxDuration = 30

export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const { txSignature } = body

  if (typeof txSignature !== 'string' || !txSignature) {
    return NextResponse.json({ error: 'txSignature required' }, { status: 400 })
  }

  const [pending] = await db.select()
    .from(withdrawals)
    .where(and(eq(withdrawals.wallet_address, walletAddress), eq(withdrawals.status, 'pending')))
    .limit(1)

  if (!pending) {
    return NextResponse.json({ error: 'No pending withdrawal found' }, { status: 404 })
  }

  const [updated] = await db.update(withdrawals)
    .set({ status: 'completed', completed_tx: txSignature, completed_at: new Date() })
    .where(eq(withdrawals.id, pending.id))
    .returning()

  return NextResponse.json({ withdrawal: updated })
})
