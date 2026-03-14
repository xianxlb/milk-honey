import { NextRequest, NextResponse } from 'next/server'
import { getDb, getPackById, createCard, openPack, getTotalDepositedCents } from '@/lib/db'
import { BUILDING_TYPES } from '@/lib/constants'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params
  const db = getDb()

  const pack = getPackById(db, packId)
  if (!pack) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
  }
  if (pack.cardId !== null) {
    return NextResponse.json({ error: 'Pack already opened' }, { status: 400 })
  }

  const prosperityCents = getTotalDepositedCents(db, pack.cityId)
  const prosperityDollars = prosperityCents / 100
  const available = BUILDING_TYPES.filter(b => prosperityDollars >= b.unlockProsperity)
  const buildingType = available[Math.floor(Math.random() * available.length)].type

  const card = createCard(db, pack.cityId, buildingType, 0)
  const openedPack = openPack(db, pack.id, card.id)

  return NextResponse.json({
    pack: { id: openedPack.id, cardId: openedPack.cardId, openedAt: openedPack.openedAt },
    card: {
      id: card.id,
      buildingType: card.buildingType,
      level: card.level,
      createdAt: card.createdAt,
    },
  })
}
