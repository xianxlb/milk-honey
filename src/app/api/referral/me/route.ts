import { NextResponse } from 'next/server'
import { eq, sum } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, users, deposits, cards } from '@/lib/db'
import { readPosition, readApy } from '@/lib/lulo'

export const GET = withAuth(async (_req, { walletAddress }) => {
  const [user] = await db.select().from(users).where(eq(users.wallet_address, walletAddress))
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const [depositResult, userCards, positionUsdc, apy] = await Promise.all([
    db.select({ total: sum(deposits.amount_usdc) }).from(deposits).where(eq(deposits.wallet_address, walletAddress)),
    db.select().from(cards).where(eq(cards.wallet_address, walletAddress)),
    readPosition(walletAddress).catch(() => 0),
    readApy().catch(() => 0),
  ])

  const totalDepositedUsdc = Number(depositResult[0]?.total ?? 0)
  const yieldEarnedUsdc = Math.max(0, positionUsdc - totalDepositedUsdc)

  return NextResponse.json({
    farmCode: user.farm_code,
    farmName: user.name ?? 'A Milk & Honey Saver',
    yieldEarnedUsdc,
    apyPercent: apy,
    cardCount: userCards.length,
  })
})
