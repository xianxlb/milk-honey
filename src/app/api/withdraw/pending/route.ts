import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, withdrawals } from '@/lib/db'

export const GET = withAuth(async (_req, { walletAddress }) => {
  const [pending] = await db.select()
    .from(withdrawals)
    .where(and(eq(withdrawals.wallet_address, walletAddress), eq(withdrawals.status, 'pending')))
    .limit(1)

  return NextResponse.json(pending ?? null)
})
