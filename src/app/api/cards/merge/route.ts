import { NextResponse } from 'next/server'
import { and, eq, or } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, cards, packs } from '@/lib/db'
import { canMergeBuildings } from '@/lib/game-logic'

export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const { cardId1, cardId2 } = body

  if (!cardId1 || !cardId2) {
    return NextResponse.json({ error: 'cardId1 and cardId2 required' }, { status: 400 })
  }

  const [c1] = await db.select().from(cards).where(and(eq(cards.id, cardId1), eq(cards.wallet_address, walletAddress)))
  const [c2] = await db.select().from(cards).where(and(eq(cards.id, cardId2), eq(cards.wallet_address, walletAddress)))

  if (!c1 || !c2) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  // Adapt DB card rows to the Building shape expected by canMergeBuildings
  const b1 = { id: c1.id, type: c1.building_type, level: c1.level, totalValue: 0 }
  const b2 = { id: c2.id, type: c2.building_type, level: c2.level, totalValue: 0 }

  if (!canMergeBuildings(b1 as any, b2 as any)) {
    return NextResponse.json({ error: 'Cards cannot be merged (different type, level, or max level reached)' }, { status: 422 })
  }

  // Unlink cards from packs before deleting (FK constraint)
  await db.update(packs).set({ card_id: null }).where(or(eq(packs.card_id, cardId1), eq(packs.card_id, cardId2)))
  await db.delete(cards).where(or(eq(cards.id, cardId1), eq(cards.id, cardId2)))

  const [merged] = await db.insert(cards)
    .values({ wallet_address: walletAddress, building_type: c1.building_type, level: c1.level + 1 })
    .returning()

  return NextResponse.json({ card: merged })
})
