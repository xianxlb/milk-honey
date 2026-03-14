import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, users } from '@/lib/db'

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
  return NextResponse.json({
    walletAddress: user.wallet_address,
    name: user.name,
    createdAt: user.created_at,
  })
})
