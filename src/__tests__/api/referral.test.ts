import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDb, createCity, createDeposit, createCard,
  getTotalDepositedCents, calculateYieldCents, getCardsByCityId,
} from '@/lib/db'
import Database from 'better-sqlite3'

let db: Database.Database

beforeEach(() => {
  db = getDb(':memory:')
})

describe('referral social proof', () => {
  it('returns referrer stats', () => {
    const city = createCity(db, 'Xian City')
    createDeposit(db, city.id, 50000) // $500
    createCard(db, city.id, 'bakery', 0)
    createCard(db, city.id, 'pet-shop', 2)

    const totalDeposited = getTotalDepositedCents(db, city.id)
    const yieldEarned = calculateYieldCents(db, city.id)
    const cards = getCardsByCityId(db, city.id)

    expect(city.name).toBe('Xian City')
    expect(totalDeposited).toBe(50000)
    expect(yieldEarned).toBeGreaterThanOrEqual(0)
    expect(cards).toHaveLength(2)
  })
})
