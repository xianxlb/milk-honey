import { NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, packs, cards } from '@/lib/db'
import { ANIMAL_TYPE_CONFIGS } from '@/lib/constants'

export const POST = withAuth(async (_req, { walletAddress, params }) => {
  const packId = params?.id
  if (!packId) return NextResponse.json({ error: 'Pack ID required' }, { status: 400 })

  const [pack] = await db.select().from(packs).where(
    and(eq(packs.id, packId), eq(packs.wallet_address, walletAddress), isNull(packs.opened_at))
  )
  if (!pack) return NextResponse.json({ error: 'Pack not found or already opened' }, { status: 404 })

  const animalType = ANIMAL_TYPE_CONFIGS[Math.floor(Math.random() * ANIMAL_TYPE_CONFIGS.length)].type

  const [card] = await db.insert(cards)
    .values({ wallet_address: walletAddress, animal_type: animalType, level: 1 })
    .returning()

  await db.update(packs)
    .set({ card_id: card.id, opened_at: new Date() })
    .where(eq(packs.id, packId))

  return NextResponse.json({ card, pack: { ...pack, card_id: card.id, opened_at: new Date() } })
})
