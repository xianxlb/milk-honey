import { describe, it, expect, beforeEach } from 'vitest'
import { getDb, createCity } from '@/lib/db'
import Database from 'better-sqlite3'

let db: Database.Database

beforeEach(() => {
  db = getDb(':memory:')
})

describe('POST /api/cities logic', () => {
  it('creates a city without referral', () => {
    const city = createCity(db, 'My City')
    expect(city.name).toBe('My City')
    expect(city.referredBy).toBeNull()
  })

  it('creates a city with valid referral code', () => {
    const referrer = createCity(db, 'Referrer City')
    const city = createCity(db, 'My City', referrer.id)
    expect(city.referredBy).toBe(referrer.id)
  })
})
