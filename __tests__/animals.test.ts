import { describe, it, expect } from 'vitest'
import {
  ANIMAL_TYPES,
  getAnimalConfig,
  getAnimalDialogue,
  getAnimalName,
  getAnimalPersonality,
  type AnimalType,
} from '@/lib/animals'

describe('ANIMAL_TYPES', () => {
  it('contains exactly 8 animals', () => {
    expect(ANIMAL_TYPES).toHaveLength(8)
  })

  it('includes all expected types', () => {
    const types = ANIMAL_TYPES.map(a => a.type)
    expect(types).toContain('cow')
    expect(types).toContain('pig')
    expect(types).toContain('duck')
    expect(types).toContain('dog')
    expect(types).toContain('sheep')
    expect(types).toContain('frog')
    expect(types).toContain('chicken')
    expect(types).toContain('horse')
  })

  it('each animal has 8 dialogue lines', () => {
    for (const animal of ANIMAL_TYPES) {
      expect(animal.dialogue).toHaveLength(8)
    }
  })

  it('each animal has non-empty name and personality', () => {
    for (const animal of ANIMAL_TYPES) {
      expect(animal.name.length).toBeGreaterThan(0)
      expect(animal.personality.length).toBeGreaterThan(0)
    }
  })
})

describe('getAnimalConfig', () => {
  it('returns correct name for cow', () => {
    expect(getAnimalConfig('cow').name).toBe('Bessie')
  })

  it('returns correct name for pig', () => {
    expect(getAnimalConfig('pig').name).toBe('Sir Reginald')
  })
})

describe('getAnimalDialogue', () => {
  it('returns a non-empty string for level 1', () => {
    const line = getAnimalDialogue('cow', 1)
    expect(typeof line).toBe('string')
    expect(line.length).toBeGreaterThan(0)
  })

  it('returns a non-empty string for level 8', () => {
    const line = getAnimalDialogue('cow', 8)
    expect(typeof line).toBe('string')
    expect(line.length).toBeGreaterThan(0)
  })

  it('returns different lines for different levels', () => {
    const l1 = getAnimalDialogue('dog', 1)
    const l4 = getAnimalDialogue('dog', 4)
    expect(l1).not.toBe(l4)
  })
})

describe('getAnimalName', () => {
  it('returns "Bessie" for cow', () => {
    expect(getAnimalName('cow')).toBe('Bessie')
  })
})

describe('getAnimalPersonality', () => {
  it('returns a non-empty string for any animal', () => {
    expect(getAnimalPersonality('frog').length).toBeGreaterThan(0)
  })
})
