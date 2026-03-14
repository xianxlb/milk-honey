import { describe, it, expect } from 'vitest'
import { getDb, createCity, getCityById, createDeposit, getDepositsByCityId, createPack, getPackById, getUnopenedPacksByCityId, openPack, createCard, getCardById, getCardsByCityId, deleteCard, calculateYieldCents } from '@/lib/db'

describe('cities', () => {
  it('creates and retrieves a city', () => {
    const db = getDb(':memory:')
    const city = createCity(db, 'Test City')
    expect(city.name).toBe('Test City')
    expect(city.id).toBeDefined()
    expect(city.referredBy).toBeNull()

    const fetched = getCityById(db, city.id)
    expect(fetched).toEqual(city)
  })

  it('creates a city with referral', () => {
    const db = getDb(':memory:')
    const referrer = createCity(db, 'Referrer')
    const referred = createCity(db, 'Referred', referrer.id)
    expect(referred.referredBy).toBe(referrer.id)
  })
})

describe('deposits', () => {
  it('creates and retrieves deposits', () => {
    const db = getDb(':memory:')
    const city = createCity(db, 'Test City')
    const deposit = createDeposit(db, city.id, 35000) // $350 in cents
    expect(deposit.amount).toBe(35000)
    expect(deposit.cityId).toBe(city.id)

    const deposits = getDepositsByCityId(db, city.id)
    expect(deposits).toHaveLength(1)
    expect(deposits[0].id).toBe(deposit.id)
  })
})

describe('packs', () => {
  it('creates and retrieves unopened packs', () => {
    const db = getDb(':memory:')
    const city = createCity(db, 'Test City')
    const pack = createPack(db, city.id)
    expect(pack.cardId).toBeNull()

    const unopened = getUnopenedPacksByCityId(db, city.id)
    expect(unopened).toHaveLength(1)
  })

  it('opens a pack by linking a card', () => {
    const db = getDb(':memory:')
    const city = createCity(db, 'Test City')
    const pack = createPack(db, city.id)
    const card = createCard(db, city.id, 'flower-shop', 0)
    const opened = openPack(db, pack.id, card.id)
    expect(opened.cardId).toBe(card.id)
    expect(opened.openedAt).toBeDefined()

    const unopened = getUnopenedPacksByCityId(db, city.id)
    expect(unopened).toHaveLength(0)
  })
})

describe('cards', () => {
  it('creates and retrieves cards', () => {
    const db = getDb(':memory:')
    const city = createCity(db, 'Test City')
    const card = createCard(db, city.id, 'pet-shop', 0)
    expect(card.buildingType).toBe('pet-shop')
    expect(card.level).toBe(0)

    const cards = getCardsByCityId(db, city.id)
    expect(cards).toHaveLength(1)
  })

  it('deletes a card', () => {
    const db = getDb(':memory:')
    const city = createCity(db, 'Test City')
    const card = createCard(db, city.id, 'bookshop', 0)
    deleteCard(db, card.id)
    const cards = getCardsByCityId(db, city.id)
    expect(cards).toHaveLength(0)
  })
})

describe('yield calculation', () => {
  it('calculates yield from deposits', () => {
    const db = getDb(':memory:')
    const city = createCity(db, 'Test City')
    // Deposit $100 (10000 cents) one year ago
    const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60
    db.prepare('INSERT INTO deposits (id, city_id, amount, created_at) VALUES (?, ?, ?, ?)')
      .run('test-dep', city.id, 10000, oneYearAgo)

    const yieldCents = calculateYieldCents(db, city.id)
    // $100 * 5% * 1 year = $5.00 = 500 cents (approximately)
    expect(yieldCents).toBeGreaterThan(490)
    expect(yieldCents).toBeLessThan(510)
  })
})
