import { NextRequest, NextResponse } from 'next/server'
import { getDb, getCityById, getCardsByCityId, calculateYieldCents } from '@/lib/db'

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
  const yieldEarnedCents = calculateYieldCents(db, cityId)

  return NextResponse.json({
    cityName: city.name,
    yieldEarned: yieldEarnedCents / 100,
    apyPercent: 5,
    cardCount: cards.length,
  })
}
