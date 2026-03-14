import { describe, it, expect, beforeEach } from 'vitest'
import { getDb, createCity, createPack, createCard, openPack, getUnopenedPacksByCityId } from '@/lib/db'
import { BUILDING_TYPES, STARTER_BUILDING_TYPES } from '@/lib/constants'
import Database from 'better-sqlite3'

let db: Database.Database

beforeEach(() => {
  db = getDb(':memory:')
})

function pickRandomBuildingType(prosperityCents: number): string {
  const prosperityDollars = prosperityCents / 100
  const available = BUILDING_TYPES.filter(b => prosperityDollars >= b.unlockProsperity)
  const idx = Math.floor(Math.random() * available.length)
  return available[idx].type
}

describe('pack opening', () => {
  it('opens a pack and creates a level-0 card', () => {
    const city = createCity(db, 'Test City')
    const pack = createPack(db, city.id)
    const buildingType = pickRandomBuildingType(0)
    const card = createCard(db, city.id, buildingType, 0)
    const opened = openPack(db, pack.id, card.id)

    expect(opened.cardId).toBe(card.id)
    expect(opened.openedAt).toBeDefined()
    expect(card.level).toBe(0)
  })

  it('only picks from starter types when prosperity < $3000', () => {
    const starterTypes = STARTER_BUILDING_TYPES.map(b => b.type)
    for (let i = 0; i < 20; i++) {
      const type = pickRandomBuildingType(0)
      expect(starterTypes).toContain(type)
    }
  })

  it('picks from all 5 types', () => {
    const types = new Set<string>()
    for (let i = 0; i < 200; i++) {
      types.add(pickRandomBuildingType(0))
    }
    expect(types.size).toBe(5)
  })
})
