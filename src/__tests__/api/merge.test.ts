import { describe, it, expect, beforeEach } from 'vitest'
import { getDb, createCity, createCard, getCardById, getCardsByCityId, deleteCard, validateMerge } from '@/lib/db'
import Database from 'better-sqlite3'

let db: Database.Database

beforeEach(() => {
  db = getDb(':memory:')
})

describe('card merging', () => {
  it('merges two same-type same-level cards into level+1', () => {
    const city = createCity(db, 'Test City')
    const card1 = createCard(db, city.id, 'flower-shop', 0)
    const card2 = createCard(db, city.id, 'flower-shop', 0)

    deleteCard(db, card1.id)
    deleteCard(db, card2.id)
    const merged = createCard(db, city.id, 'flower-shop', 1)

    expect(merged.level).toBe(1)
    expect(getCardById(db, card1.id)).toBeNull()
    expect(getCardById(db, card2.id)).toBeNull()
    expect(getCardsByCityId(db, city.id)).toHaveLength(1)
  })

  it('rejects merge of different types', () => {
    const city = createCity(db, 'Test City')
    const card1 = createCard(db, city.id, 'flower-shop', 0)
    const card2 = createCard(db, city.id, 'pet-shop', 0)

    const error = validateMerge(card1, card2)
    expect(error).toBe('Cards must be the same type')
  })

  it('rejects merge of different levels', () => {
    const city = createCity(db, 'Test City')
    const card1 = createCard(db, city.id, 'flower-shop', 0)
    const card2 = createCard(db, city.id, 'flower-shop', 1)

    const error = validateMerge(card1, card2)
    expect(error).toBe('Cards must be the same level')
  })

  it('rejects merge at max level', () => {
    const city = createCity(db, 'Test City')
    const card1 = createCard(db, city.id, 'flower-shop', 8)
    const card2 = createCard(db, city.id, 'flower-shop', 8)

    const error = validateMerge(card1, card2)
    expect(error).toBe('Cards are already at max level')
  })
})
