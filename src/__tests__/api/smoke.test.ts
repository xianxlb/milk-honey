import { describe, it, expect } from 'vitest'
import {
  getDb, createCity, createDeposit, createPack, createCard, openPack,
  deleteCard, getCardsByCityId, getUnopenedPacksByCityId,
  getTotalDepositedCents, calculateYieldCents,
} from '@/lib/db'

describe('full demo flow', () => {
  it('referral -> deposit -> open packs -> merge cards', () => {
    const db = getDb(':memory:')

    // 1. Xian creates a city
    const xian = createCity(db, "Xian's City")
    expect(xian.id).toBeDefined()

    // 2. Xian deposits $300
    const deposit = createDeposit(db, xian.id, 30000)
    const numPacks = Math.floor(30000 / 10000) // 3 packs
    expect(numPacks).toBe(3)

    // 3. Generate packs
    const packs = []
    for (let i = 0; i < numPacks; i++) {
      packs.push(createPack(db, xian.id))
    }
    expect(getUnopenedPacksByCityId(db, xian.id)).toHaveLength(3)

    // 4. Open all packs (force flower-shop for merge test)
    const cards = []
    for (const pack of packs) {
      const card = createCard(db, xian.id, 'bakery', 0)
      openPack(db, pack.id, card.id)
      cards.push(card)
    }
    expect(getUnopenedPacksByCityId(db, xian.id)).toHaveLength(0)
    expect(getCardsByCityId(db, xian.id)).toHaveLength(3)

    // 5. Merge two level-0 bakeries -> level-1
    deleteCard(db, cards[0].id)
    deleteCard(db, cards[1].id)
    const merged = createCard(db, xian.id, 'bakery', 1)
    expect(merged.level).toBe(1)
    expect(getCardsByCityId(db, xian.id)).toHaveLength(2) // merged + remaining

    // 6. Sister gets referred
    const sister = createCity(db, "Sister's City", xian.id)
    expect(sister.referredBy).toBe(xian.id)

    // 7. Check Xian's stats for social proof
    const totalDeposited = getTotalDepositedCents(db, xian.id)
    expect(totalDeposited).toBe(30000)
    const yieldEarned = calculateYieldCents(db, xian.id)
    expect(yieldEarned).toBeGreaterThanOrEqual(0)
  })
})
