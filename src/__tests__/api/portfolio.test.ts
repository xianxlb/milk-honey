import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDb, createCity, createDeposit, createCard, createPack,
  getTotalDepositedCents, calculateYieldCents, getCardsByCityId, getUnopenedPacksByCityId,
} from '@/lib/db'
import Database from 'better-sqlite3'

let db: Database.Database

beforeEach(() => {
  db = getDb(':memory:')
})

describe('portfolio data', () => {
  it('returns complete portfolio for a city', () => {
    const city = createCity(db, 'Test City')
    createDeposit(db, city.id, 20000) // $200
    createCard(db, city.id, 'flower-shop', 0)
    createCard(db, city.id, 'pet-shop', 1)
    createPack(db, city.id) // unopened

    const cards = getCardsByCityId(db, city.id)
    const packs = getUnopenedPacksByCityId(db, city.id)
    const totalDeposited = getTotalDepositedCents(db, city.id)
    const yieldEarned = calculateYieldCents(db, city.id)

    expect(cards).toHaveLength(2)
    expect(packs).toHaveLength(1)
    expect(totalDeposited).toBe(20000)
    expect(yieldEarned).toBeGreaterThanOrEqual(0)
  })
})
