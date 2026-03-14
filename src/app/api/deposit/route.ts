import { NextRequest, NextResponse } from 'next/server'
import { getDb, getCityById, createDeposit, createPack } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cityId, amount, txSignature } = body

    if (!cityId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'cityId and positive amount required' }, { status: 400 })
    }

    const db = getDb()
    const city = getCityById(db, cityId)
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }

    const amountCents = Math.round(amount * 100)
    const deposit = createDeposit(db, cityId, amountCents)
    const numPacks = Math.floor(amountCents / 10000) // 1 pack per $100

    const packs = []
    for (let i = 0; i < numPacks; i++) {
      packs.push(createPack(db, cityId))
    }

    return NextResponse.json({
      deposit: { id: deposit.id, amount: deposit.amount, createdAt: deposit.createdAt },
      packs: packs.map(p => ({ id: p.id, cardId: p.cardId, createdAt: p.createdAt })),
      txSignature: txSignature || null,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
