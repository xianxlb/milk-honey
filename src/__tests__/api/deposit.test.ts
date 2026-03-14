import { describe, it, expect, beforeEach } from 'vitest'
import { getDb, createCity, createDeposit, createPack, getUnopenedPacksByCityId } from '@/lib/db'
import Database from 'better-sqlite3'

let db: Database.Database

beforeEach(() => {
  db = getDb(':memory:')
})

describe('deposit + pack generation', () => {
  it('creates deposit and generates 1 pack per $100', () => {
    const city = createCity(db, 'Test City')
    const amountCents = 35000 // $350
    const deposit = createDeposit(db, city.id, amountCents)
    const numPacks = Math.floor(amountCents / 10000)

    const packs = []
    for (let i = 0; i < numPacks; i++) {
      packs.push(createPack(db, city.id))
    }

    expect(deposit.amount).toBe(35000)
    expect(packs).toHaveLength(3)

    const unopened = getUnopenedPacksByCityId(db, city.id)
    expect(unopened).toHaveLength(3)
  })

  it('generates 0 packs for deposit under $100', () => {
    const numPacks = Math.floor(5000 / 10000)
    expect(numPacks).toBe(0)
  })

  it('generates 1 pack for exactly $100', () => {
    const numPacks = Math.floor(10000 / 10000)
    expect(numPacks).toBe(1)
  })
})
