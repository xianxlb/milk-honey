import { describe, it, expect } from 'vitest'
import { Building } from '@/store/types'
import {
  calculateLevel,
  canSpawnBuilding,
  canMergeBuildings,
  calculateProsperity,
  calculateTokensFromYield,
  getAvailableBuildingTypes,
  validateDeposit,
} from '@/lib/game-logic'
import { SPAWN_WINDOW_MS } from '@/lib/constants'

const makeBuilding = (overrides: Partial<Building> = {}): Building => ({
  id: 'test-1',
  type: 'bakery',
  totalValue: 100,
  depositValue: 100,
  yieldEarned: 0,
  uncollectedYield: 0,
  level: 1,
  pendingLevelUp: false,
  status: 'active',
  wiltingStartedAt: null,
  yieldSource: 'jupiter',
  createdAt: Date.now(),
  ...overrides,
})

describe('calculateLevel', () => {
  it('returns 1 for exactly 20', () => { expect(calculateLevel(20)).toBe(1) })
  it('returns 1 for 39', () => { expect(calculateLevel(39)).toBe(1) })
  it('returns 2 for 40', () => { expect(calculateLevel(40)).toBe(2) })
  it('returns 4 for 160', () => { expect(calculateLevel(160)).toBe(4) })
  it('returns 8 for 2560', () => { expect(calculateLevel(2560)).toBe(8) })
  it('caps at 8 for values above max threshold', () => { expect(calculateLevel(50000)).toBe(8) })
  it('returns 0 for values below min threshold', () => { expect(calculateLevel(10)).toBe(0) })
})

describe('canSpawnBuilding', () => {
  const now = Date.now()

  it('allows spawn when buildings list is empty', () => {
    expect(canSpawnBuilding([], [], now)).toBe(true)
  })

  it('blocks spawn when at 20 buildings', () => {
    const buildings = Array.from({ length: 20 }, (_, i) =>
      makeBuilding({ id: `b-${i}` })
    )
    expect(canSpawnBuilding(buildings, [], now)).toBe(false)
  })

  it('blocks spawn when 2 spawns occurred in last 24h', () => {
    const recentTimestamps = [now - 1000, now - 2000]
    expect(canSpawnBuilding([], recentTimestamps, now)).toBe(false)
  })

  it('allows spawn when previous spawns are older than 24h', () => {
    const oldTimestamps = [now - SPAWN_WINDOW_MS - 1000, now - SPAWN_WINDOW_MS - 2000]
    expect(canSpawnBuilding([], oldTimestamps, now)).toBe(true)
  })
})

describe('canMergeBuildings', () => {
  it('allows merge of same type and same level', () => {
    const a = makeBuilding({ id: 'a', type: 'bakery', level: 1 })
    const b = makeBuilding({ id: 'b', type: 'bakery', level: 1 })
    expect(canMergeBuildings(a, b)).toBe(true)
  })

  it('blocks merge of different types', () => {
    const a = makeBuilding({ id: 'a', type: 'bakery', level: 1 })
    const b = makeBuilding({ id: 'b', type: 'pet-shop', level: 1 })
    expect(canMergeBuildings(a, b)).toBe(false)
  })

  it('blocks merge of different levels', () => {
    const a = makeBuilding({ id: 'a', type: 'bakery', level: 1 })
    const b = makeBuilding({ id: 'b', type: 'bakery', level: 2 })
    expect(canMergeBuildings(a, b)).toBe(false)
  })

  it('blocks merge of level 8 buildings', () => {
    const a = makeBuilding({ id: 'a', type: 'bakery', level: 8 })
    const b = makeBuilding({ id: 'b', type: 'bakery', level: 8 })
    expect(canMergeBuildings(a, b)).toBe(false)
  })
})

describe('calculateProsperity', () => {
  it('sums totalValues of all buildings', () => {
    const buildings = [
      makeBuilding({ totalValue: 100 }),
      makeBuilding({ id: 'test-2', totalValue: 200 }),
      makeBuilding({ id: 'test-3', totalValue: 300 }),
    ]
    expect(calculateProsperity(buildings)).toBe(600)
  })

  it('returns 0 for empty array', () => {
    expect(calculateProsperity([])).toBe(0)
  })
})

describe('calculateTokensFromYield', () => {
  it('converts $1 to 10 tokens', () => {
    expect(calculateTokensFromYield(1)).toBe(10)
  })

  it('converts $0.10 to 1 token', () => {
    expect(calculateTokensFromYield(0.10)).toBe(1)
  })

  it('floors $0.05 to 0 tokens', () => {
    expect(calculateTokensFromYield(0.05)).toBe(0)
  })
})

describe('getAvailableBuildingTypes', () => {
  it('returns 5 types at prosperity 0', () => {
    const types = getAvailableBuildingTypes(0)
    expect(types).toHaveLength(5)
  })

  it('returns 5 types at high prosperity', () => {
    const types = getAvailableBuildingTypes(3000)
    expect(types).toHaveLength(5)
  })
})

describe('validateDeposit', () => {
  it('accepts $1 for spawn (MIN_DEPOSIT)', () => {
    expect(validateDeposit(1, 'spawn').valid).toBe(true)
  })
  it('rejects $0 for spawn', () => {
    expect(validateDeposit(0, 'spawn').valid).toBe(false)
  })
  it('accepts $1 for upgrade', () => {
    expect(validateDeposit(1, 'upgrade').valid).toBe(true)
  })
  it('rejects $0 for any action', () => {
    expect(validateDeposit(0, 'spawn').valid).toBe(false)
    expect(validateDeposit(0, 'upgrade').valid).toBe(false)
  })
})
