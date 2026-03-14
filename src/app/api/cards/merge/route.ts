import { NextRequest, NextResponse } from 'next/server'
// TODO: rewire in Chunk 5

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cardId1, cardId2 } = body

    if (!cardId1 || !cardId2) {
      return NextResponse.json({ error: 'cardId1 and cardId2 required' }, { status: 400 })
    }

    if (cardId1 === cardId2) {
      return NextResponse.json({ error: 'Cannot merge a card with itself' }, { status: 400 })
    }

    const db = getDb()
    const card1 = getCardById(db, cardId1)
    const card2 = getCardById(db, cardId2)

    if (!card1 || !card2) {
      return NextResponse.json({ error: 'One or both cards not found' }, { status: 404 })
    }

    const mergeError = validateMerge(card1, card2)
    if (mergeError) {
      return NextResponse.json({ error: mergeError }, { status: 400 })
    }

    const merged = db.transaction(() => {
      deleteCard(db, card1.id)
      deleteCard(db, card2.id)
      return createCard(db, card1.cityId, card1.buildingType, card1.level + 1)
    })()

    return NextResponse.json({
      card: {
        id: merged.id,
        buildingType: merged.buildingType,
        level: merged.level,
        createdAt: merged.createdAt,
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
