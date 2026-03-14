import { NextResponse } from 'next/server'
import { and, eq, isNull, sum } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, cards, packs, deposits } from '@/lib/db'
import { readPosition } from '@/lib/lulo'

export const GET = withAuth(async (_req, { walletAddress }) => {
  const [userCards, unopenedPacks, depositResult, positionUsdc] = await Promise.all([
    db.select().from(cards).where(eq(cards.wallet_address, walletAddress)),
    db.select().from(packs).where(
      and(eq(packs.wallet_address, walletAddress), isNull(packs.opened_at))
    ),
    db.select({ total: sum(deposits.amount_usdc) })
      .from(deposits)
      .where(eq(deposits.wallet_address, walletAddress)),
    readPosition(walletAddress).catch(() => 0),
  ])

  const totalDepositedUsdc = Number(depositResult[0]?.total ?? 0)
  const yieldEarnedUsdc = Math.max(0, positionUsdc - totalDepositedUsdc)

  return NextResponse.json({
    cards: userCards,
    packs: unopenedPacks,
    stats: {
      totalDepositedUsdc,
      yieldEarnedUsdc,
      // apyPercent is a display approximation — Lulo routes to best available rate
      apyPercent: 5,
      cardCount: userCards.length,
      unopenedPackCount: unopenedPacks.length,
    },
  })
})
