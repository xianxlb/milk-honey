import { NextRequest, NextResponse } from 'next/server'
import { getDb, createCity, getCityById } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, referralCode } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const db = getDb()

  if (referralCode) {
    const referrer = getCityById(db, referralCode)
    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }
  }

  const city = createCity(db, name.trim(), referralCode || undefined)
  return NextResponse.json({
    id: city.id,
    name: city.name,
    referralCode: city.id,
    createdAt: city.createdAt,
  }, { status: 201 })
}
