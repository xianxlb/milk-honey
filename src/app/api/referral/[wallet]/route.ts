import { NextResponse } from 'next/server'
import { eq, sum } from 'drizzle-orm'
import { db, users, deposits, cards } from '@/lib/db'
import { readPosition } from '@/lib/lulo'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ wallet: string }> | { wallet: string } }
) {
  const { wallet } = params instanceof Promise ? await params : params

  const [user] = await db.select().from(users).where(eq(users.wallet_address, wallet))
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [depositResult, userCards, positionUsdc] = await Promise.all([
    db.select({ total: sum(deposits.amount_usdc) }).from(deposits).where(eq(deposits.wallet_address, wallet)),
    db.select().from(cards).where(eq(cards.wallet_address, wallet)),
    readPosition(wallet).catch(() => 0),
  ])

  const totalDepositedUsdc = Number(depositResult[0]?.total ?? 0)
  const yieldEarnedUsdc = Math.max(0, positionUsdc - totalDepositedUsdc)

  return NextResponse.json({
    cityName: user.name ?? 'A Milk & Honey Saver',
    yieldEarnedUsdc,
    apyPercent: 5,
    cardCount: userCards.length,
  })
}
