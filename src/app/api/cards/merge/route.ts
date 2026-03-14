import { NextRequest, NextResponse } from 'next/server'
import { getDb, getCardById, deleteCard, createCard, validateMerge } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cardId1, cardId2 } = body

  if (!cardId1 || !cardId2) {
    return NextResponse.json({ error: 'cardId1 and cardId2 required' }, { status: 400 })
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

  deleteCard(db, card1.id)
  deleteCard(db, card2.id)
  const merged = createCard(db, card1.cityId, card1.buildingType, card1.level + 1)

  return NextResponse.json({
    card: {
      id: merged.id,
      buildingType: merged.buildingType,
      level: merged.level,
      createdAt: merged.createdAt,
    },
  })
}
