import { NextResponse } from 'next/server'
import { and, desc, eq, isNull, sum } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, cards, packs, deposits } from '@/lib/db'
import { readPosition, readApy } from '@/lib/lulo'

export const GET = withAuth(async (_req, { walletAddress }) => {
  const [userCards, unopenedPacks, depositResult, positionUsdc, apyPercent, latestDeposit] = await Promise.all([
    db.select().from(cards).where(eq(cards.wallet_address, walletAddress)),
    db.select().from(packs).where(
      and(eq(packs.wallet_address, walletAddress), isNull(packs.opened_at))
    ),
    db.select({ total: sum(deposits.amount_usdc) })
      .from(deposits)
      .where(eq(deposits.wallet_address, walletAddress)),
    readPosition(walletAddress).catch(() => 0),
    readApy().catch(() => 0),
    db.select({ created_at: deposits.created_at })
      .from(deposits)
      .where(eq(deposits.wallet_address, walletAddress))
      .orderBy(desc(deposits.created_at))
      .limit(1),
  ])

  const totalDepositedUsdc = Number(depositResult[0]?.total ?? 0)
  const yieldEarnedUsdc = Math.max(0, positionUsdc - totalDepositedUsdc)

  return NextResponse.json({
    cards: userCards,
    packs: unopenedPacks,
    lastDepositAt: latestDeposit[0]?.created_at ?? null,
    stats: {
      totalDepositedUsdc,
      yieldEarnedUsdc,
      apyPercent,
      cardCount: userCards.length,
      unopenedPackCount: unopenedPacks.length,
    },
  })
})
