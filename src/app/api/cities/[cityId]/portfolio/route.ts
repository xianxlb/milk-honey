import { NextRequest, NextResponse } from 'next/server'
import {
  getDb, getCityById, getCardsByCityId, getUnopenedPacksByCityId,
  getTotalDepositedCents, calculateYieldCents,
} from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
  const { cityId } = await params
  const db = getDb()

  const city = getCityById(db, cityId)
  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 })
  }

  const cards = getCardsByCityId(db, cityId)
  const packs = getUnopenedPacksByCityId(db, cityId)
  const totalDepositedCents = getTotalDepositedCents(db, cityId)
  const yieldEarnedCents = calculateYieldCents(db, cityId)

  return NextResponse.json({
    city: { id: city.id, name: city.name, createdAt: city.createdAt },
    cards: cards.map(c => ({
      id: c.id, buildingType: c.buildingType, level: c.level, createdAt: c.createdAt,
    })),
    packs: packs.map(p => ({ id: p.id, cardId: p.cardId, createdAt: p.createdAt })),
    stats: {
      totalDepositedCents,
      yieldEarnedCents,
      apyPercent: 5,
      prosperity: totalDepositedCents / 100,
      cardCount: cards.length,
      unopenedPackCount: packs.length,
    },
  })
}
