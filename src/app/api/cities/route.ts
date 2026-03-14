import { NextRequest, NextResponse } from 'next/server'
import { getDb, createCity, getCityById, getCityByWalletAddress } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, referralCode, walletAddress } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const db = getDb()

    // If wallet address provided, return existing city for that wallet
    if (walletAddress && typeof walletAddress === 'string') {
      const existing = getCityByWalletAddress(db, walletAddress)
      if (existing) {
        return NextResponse.json({
          id: existing.id,
          name: existing.name,
          walletAddress: existing.walletAddress,
          referralCode: existing.id,
          createdAt: existing.createdAt,
        }, { status: 200 })
      }
    }

    if (referralCode) {
      const referrer = getCityById(db, referralCode)
      if (!referrer) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
      }
    }

    const city = createCity(db, name.trim(), referralCode || undefined, walletAddress || undefined)
    return NextResponse.json({
      id: city.id,
      name: city.name,
      walletAddress: city.walletAddress,
      referralCode: city.id,
      createdAt: city.createdAt,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
