import { describe, it, expect } from 'vitest'
import { Animal } from '@/store/types'
import {
  calculateLevel,
  canSpawnAnimal,
  canMergeAnimals,
  calculateProsperity,
  calculateTokensFromYield,
  getAvailableAnimalTypes,
  validateDeposit,
} from '@/lib/game-logic'
import { SPAWN_WINDOW_MS } from '@/lib/constants'

const makeAnimal = (overrides: Partial<Animal> = {}): Animal => ({
  id: 'test-1',
  type: 'cow',
  totalValue: 20,
  depositValue: 20,
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

describe('canSpawnAnimal', () => {
  const now = Date.now()

  it('allows spawn when crew is empty', () => {
    expect(canSpawnAnimal([], [], now)).toBe(true)
  })

  it('blocks spawn when at 20 animals', () => {
    const animals = Array.from({ length: 20 }, (_, i) => makeAnimal({ id: `a-${i}` }))
    expect(canSpawnAnimal(animals, [], now)).toBe(false)
  })

  it('blocks spawn when 2 spawns occurred in last 24h', () => {
    expect(canSpawnAnimal([], [now - 1000, now - 2000], now)).toBe(false)
  })

  it('allows spawn when previous spawns are older than 24h', () => {
    const old = [now - SPAWN_WINDOW_MS - 1000, now - SPAWN_WINDOW_MS - 2000]
    expect(canSpawnAnimal([], old, now)).toBe(true)
  })
})

describe('canMergeAnimals', () => {
  it('allows merge of same type and same level', () => {
    const a = makeAnimal({ id: 'a', type: 'cow', level: 1 })
    const b = makeAnimal({ id: 'b', type: 'cow', level: 1 })
    expect(canMergeAnimals(a, b)).toBe(true)
  })

  it('blocks merge of different types', () => {
    const a = makeAnimal({ id: 'a', type: 'cow', level: 1 })
    const b = makeAnimal({ id: 'b', type: 'dog', level: 1 })
    expect(canMergeAnimals(a, b)).toBe(false)
  })

  it('blocks merge of different levels', () => {
    const a = makeAnimal({ id: 'a', type: 'cow', level: 1 })
    const b = makeAnimal({ id: 'b', type: 'cow', level: 2 })
    expect(canMergeAnimals(a, b)).toBe(false)
  })

  it('blocks merge of level 8 animals', () => {
    const a = makeAnimal({ id: 'a', type: 'cow', level: 8 })
    const b = makeAnimal({ id: 'b', type: 'cow', level: 8 })
    expect(canMergeAnimals(a, b)).toBe(false)
  })
})

describe('calculateProsperity', () => {
  it('sums totalValues of all animals', () => {
    const animals = [
      makeAnimal({ totalValue: 100 }),
      makeAnimal({ id: 'test-2', totalValue: 200 }),
      makeAnimal({ id: 'test-3', totalValue: 300 }),
    ]
    expect(calculateProsperity(animals)).toBe(600)
  })

  it('returns 0 for empty array', () => {
    expect(calculateProsperity([])).toBe(0)
  })
})

describe('calculateTokensFromYield', () => {
  it('converts $1 to 10 tokens', () => { expect(calculateTokensFromYield(1)).toBe(10) })
  it('converts $0.10 to 1 token', () => { expect(calculateTokensFromYield(0.10)).toBe(1) })
  it('floors $0.05 to 0 tokens', () => { expect(calculateTokensFromYield(0.05)).toBe(0) })
})

describe('getAvailableAnimalTypes', () => {
  it('returns all 8 types at prosperity 0', () => {
    expect(getAvailableAnimalTypes(0)).toHaveLength(8)
  })

  it('returns all 8 types at high prosperity', () => {
    expect(getAvailableAnimalTypes(3000)).toHaveLength(8)
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
