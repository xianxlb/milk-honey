import { NextRequest, NextResponse } from 'next/server'
// TODO: rewire in Chunk 5
import { BUILDING_TYPES } from '@/lib/constants'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
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

    const card = createCard(db, pack.cityId, buildingType, 1)
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
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
