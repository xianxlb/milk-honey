import { NextResponse } from 'next/server'
import { eq, sum } from 'drizzle-orm'
import { db, users, deposits, cards } from '@/lib/db'
import { readPosition, readApy } from '@/lib/lulo'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ farm_code: string }> }
) {
  const { farm_code } = await params

  const [user] = await db.select().from(users).where(eq(users.farm_code, farm_code))
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const wallet = user.wallet_address

  const [depositResult, userCards, positionUsdc, apy] = await Promise.all([
    db.select({ total: sum(deposits.amount_usdc) }).from(deposits).where(eq(deposits.wallet_address, wallet)),
    db.select().from(cards).where(eq(cards.wallet_address, wallet)),
    readPosition(wallet).catch(() => 0),
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
}
