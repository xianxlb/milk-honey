import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, users } from '@/lib/db'
import { addWalletToWebhook } from '@/lib/helius'
import { generateCityCode } from '@/lib/city-code'

async function assignFarmCode(walletAddress: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCityCode()
    try {
      const [updated] = await db.update(users)
        .set({ farm_code: code })
        .where(eq(users.wallet_address, walletAddress))
        .returning()
      return updated.farm_code!
    } catch {
      // Unique constraint violation — try again
    }
  }
  throw new Error('Failed to assign farm_code after 5 attempts')
}

export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const name: string | null = typeof body.name === 'string' ? body.name : null

  const insert = db.insert(users).values({ wallet_address: walletAddress, name })
  if (name !== null) {
    await insert.onConflictDoUpdate({ target: users.wallet_address, set: { name } })
  } else {
    await insert.onConflictDoNothing()
  }

  const [user] = await db.select().from(users).where(eq(users.wallet_address, walletAddress))

  // Generate farm_code for new users (or users who don't have one yet)
  if (!user.farm_code) {
    await assignFarmCode(walletAddress)
  }

  const [updatedUser] = await db.select().from(users).where(eq(users.wallet_address, walletAddress))

  // Best-effort: register wallet with Helius webhook for deposit monitoring
  addWalletToWebhook(walletAddress).catch(() => {})

  return NextResponse.json({
    walletAddress: updatedUser.wallet_address,
    name: updatedUser.name,
    farmCode: updatedUser.farm_code,
    createdAt: updatedUser.created_at,
  })
})
