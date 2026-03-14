import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, users } from '@/lib/db'

export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const name: string | null = typeof body.name === 'string' ? body.name : null

  // Build update set — only include name if explicitly provided
  const updateSet = name !== null ? { name } : {}

  await db.insert(users)
    .values({ wallet_address: walletAddress, name })
    .onConflictDoUpdate({
      target: users.wallet_address,
      set: Object.keys(updateSet).length > 0 ? updateSet : { wallet_address: walletAddress },
    })

  const [user] = await db.select().from(users).where(eq(users.wallet_address, walletAddress))
  return NextResponse.json({
    walletAddress: user.wallet_address,
    name: user.name,
    createdAt: user.created_at,
  })
})
