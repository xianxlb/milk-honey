# Animal Theme Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the buildings/village metaphor with an animal crew throughout the codebase — new content file, DB column rename, updated types/routes/UI, new IntroDialogue and RaccoonEvent components.

**Architecture:** Single content file (`src/lib/animals.ts`) owns all animal personality/dialogue. DB gets one column rename (`building_type` → `animal_type`). All "building" identifiers in types, constants, game-logic, routes, and UI are renamed to "animal" equivalents. Two new UI components handle first-encounter intro and the lapsed-deposit raccoon event.

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle ORM (Postgres), Vitest, Tailwind CSS, Framer Motion

---

## ⚠️ Pre-flight: currently failing tests

9 tests are already failing from the $20 pack price change (thresholds updated, tests not). Fix these in Task 1 before touching anything else.

---

## File Map

**Create:**
- `src/lib/animals.ts` — animal roster, personalities, 8-level dialogue arrays
- `src/lib/animal-images.ts` — image path resolution per type+level (replaces building-images.ts)
- `src/app/animal/[id]/page.tsx` — new animal detail page
- `src/components/IntroDialogue.tsx` — first-encounter bottom overlay
- `src/components/RaccoonEvent.tsx` — lapsed-deposit event banner
- `src/lib/db/migrations/0001_animal_rename.sql` — DB column rename
- `__tests__/animals.test.ts` — unit tests for animals.ts helpers

**Modify:**
- `__tests__/game-logic.test.ts` — fix broken threshold tests, rename building→animal types
- `src/store/types.ts` — rename Building→Animal, BuildingType→AnimalType, etc.
- `src/lib/constants.ts` — replace BUILDING_TYPES with ANIMAL_TYPES (8 animals)
- `src/lib/game-logic.ts` — rename all building→animal references
- `src/lib/db/schema.ts` — rename building_type→animal_type column
- `src/app/api/packs/[id]/open/route.ts` — BUILDING_TYPES→ANIMAL_TYPES, building_type→animal_type
- `src/app/api/cards/merge/route.ts` — building_type→animal_type, canMergeBuildings→canMergeAnimals
- `src/app/page.tsx` — "Your Crew", animal card grid, RaccoonEvent integration
- `src/app/open-pack/page.tsx` — animal copy, building→animal refs, intro dialogue trigger
- `src/__tests__/api/deposit-verify.test.ts` — fix pack count assertion ($20 pack price)
- `src/__tests__/api/portfolio.test.ts` — fix readApy mock

**Delete:**
- `src/lib/building-images.ts` — replaced by animal-images.ts
- `src/app/building/` — entire directory (replaced by src/app/animal/)

---

## Task 1: Fix Existing Failing Tests

**Files:**
- Modify: `__tests__/game-logic.test.ts`
- Modify: `src/__tests__/api/deposit-verify.test.ts`
- Modify: `src/__tests__/api/portfolio.test.ts`

- [ ] **Step 1: Run tests and confirm the 9 failures**

```bash
npm test 2>&1 | grep "FAIL\|Tests"
```

Expected: 3 test files failing, 9 tests failing total.

- [ ] **Step 2: Fix `__tests__/game-logic.test.ts`**

Replace the `calculateLevel` describe block (thresholds changed from $100-based to $20-based) and fix `validateDeposit` ($99 is now valid since MIN_DEPOSIT=1) and `getAvailableBuildingTypes` (will be renamed later but fix counts now — still 5 types until Task 3):

```typescript
// Replace entire describe('calculateLevel', ...) block:
describe('calculateLevel', () => {
  it('returns 1 for exactly 20', () => {
    expect(calculateLevel(20)).toBe(1)
  })

  it('returns 1 for 39', () => {
    expect(calculateLevel(39)).toBe(1)
  })

  it('returns 2 for 40', () => {
    expect(calculateLevel(40)).toBe(2)
  })

  it('returns 4 for 160', () => {
    expect(calculateLevel(160)).toBe(4)
  })

  it('returns 8 for 2560', () => {
    expect(calculateLevel(2560)).toBe(8)
  })

  it('caps at 8 for values above max threshold', () => {
    expect(calculateLevel(50000)).toBe(8)
  })

  it('returns 0 for values below min threshold', () => {
    expect(calculateLevel(10)).toBe(0)
  })
})
```

Also fix `validateDeposit` — MIN_DEPOSIT is 1, so $1 is the spawn minimum:
```typescript
// Replace describe('validateDeposit', ...) block:
describe('validateDeposit', () => {
  it('accepts $1 for spawn (MIN_DEPOSIT)', () => {
    const result = validateDeposit(1, 'spawn')
    expect(result.valid).toBe(true)
  })

  it('rejects $0 for spawn', () => {
    const result = validateDeposit(0, 'spawn')
    expect(result.valid).toBe(false)
  })

  it('accepts $1 for upgrade', () => {
    const result = validateDeposit(1, 'upgrade')
    expect(result.valid).toBe(true)
  })

  it('rejects $0 for any action', () => {
    expect(validateDeposit(0, 'spawn').valid).toBe(false)
    expect(validateDeposit(0, 'upgrade').valid).toBe(false)
  })
})
```

- [ ] **Step 3: Fix `src/__tests__/api/deposit-verify.test.ts`**

Pack price is now $20 (20_000_000 micro-units). Find the pack count assertion and update:
```typescript
// $300 deposit → 15 packs (was 3 packs at $100 each)
// Find and replace the assertion, e.g.:
expect(insertedPacks).toHaveLength(15)
// And the test description:
it('credits 15 packs for 300 USDC deposit', ...)
```

- [ ] **Step 4: Fix `src/__tests__/api/portfolio.test.ts`**

The mock is missing `readApy`. Find the `vi.mock('@/lib/lulo', ...)` call and add `readApy`:
```typescript
vi.mock('@/lib/lulo', () => ({
  readPosition: vi.fn().mockResolvedValue(1_050_000), // $1.05 position
  readApy: vi.fn().mockResolvedValue(5.5),            // 5.5% APY
}))
```

- [ ] **Step 5: Run tests — all should pass**

```bash
npm test
```
Expected: all 59 tests pass (or at minimum the previously-failing 9 are now green).

- [ ] **Step 6: Commit**

```bash
git add __tests__/game-logic.test.ts src/__tests__/api/deposit-verify.test.ts src/__tests__/api/portfolio.test.ts
git commit -m "fix: update tests for $20 pack price and fix readApy mock"
```

---

## Task 2: Animals Content File

**Files:**
- Create: `__tests__/animals.test.ts`
- Create: `src/lib/animals.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/animals.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/animals.test.ts
```
Expected: FAIL — module `@/lib/animals` not found.

- [ ] **Step 3: Implement `src/lib/animals.ts`**

```typescript
export type AnimalType = 'cow' | 'pig' | 'duck' | 'dog' | 'sheep' | 'frog' | 'chicken' | 'horse'

export interface AnimalConfig {
  type: AnimalType
  name: string
  personality: string
  emoji: string
  dialogue: [string, string, string, string, string, string, string, string]
}

export const ANIMAL_TYPES: AnimalConfig[] = [
  {
    type: 'cow',
    name: 'Bessie',
    personality: "Rebel. Doesn't follow rules.",
    emoji: '🐄',
    dialogue: [
      "Rules? Never heard of them.",
      "My scooter goes faster than your scooter.",
      "I read the terms. I disagree with all of them.",
      "I cape, therefore I am.",
      "They said I couldn't. That was motivating.",
      "The rulebook? Great coaster.",
      "I have opinions about speed limits.",
      "Legendary. It's a whole thing.",
    ],
  },
  {
    type: 'pig',
    name: 'Sir Reginald',
    personality: "Distinguished gentleman. Hopelessly clumsy.",
    emoji: '🐷',
    dialogue: [
      "One must maintain standards. *trips*",
      "The monocle is prescription. Also decorative.",
      "I assure you this is entirely intentional.",
      "A gentleman recovers with grace. *tips hat into puddle*",
      "Dignity is a state of mind. Mine is fine.",
      "The top hat improves my balance. Marginally.",
      "I have fallen upward. It's a technique.",
      "Distinguished. Absolutely distinguished.",
    ],
  },
  {
    type: 'duck',
    name: 'Gerald',
    personality: "Assigned as delivery duck. Delivers only on foot.",
    emoji: '🦆',
    dialogue: [
      "I am on vacation. Also your package.",
      "Waddling is faster than it looks.",
      "ETA: whenever. I'm on beach time.",
      "The delivery window is 'eventually'.",
      "I took the scenic route. Twice.",
      "Your package is safe. I sat on it briefly.",
      "Five stars. Rate me five stars.",
      "Gerald Delivers™. Mostly.",
    ],
  },
  {
    type: 'dog',
    name: 'Biscuit',
    personality: "Terrified of humans. Communicates via whiteboard only.",
    emoji: '🐶',
    dialogue: [
      "*holds up whiteboard* hi",
      "*erases and rewrites* this is fine",
      "*whiteboard* please do not look directly at me",
      "*writes slowly* i am brave actually",
      "*whiteboard* everything is okay. check back later.",
      "*extensive diagram* i am doing well",
      "*whiteboard* humans aren't so bad I guess",
      "*writes in big letters* BISCUIT",
    ],
  },
  {
    type: 'sheep',
    name: 'Wooly',
    personality: "Always freezing. Constantly bundled up, always has a hot drink.",
    emoji: '🐑',
    dialogue: [
      "It's cold. *sips cocoa*",
      "The wool doesn't help, actually.",
      "This is my third sweater. Still cold.",
      "Hot drink number four. Still.",
      "They said summer would come. I have my doubts.",
      "Six layers. Progress.",
      "I made peace with the cold. The cold did not reciprocate.",
      "Warm on the inside. Barely. *sips*",
    ],
  },
  {
    type: 'frog',
    name: 'Ribbit',
    personality: "Clown suit. Balances on a ball. Laughs at own jokes.",
    emoji: '🐸',
    dialogue: [
      "Why did the frog cross the road? Because I DID! *laughs*",
      "*falls off ball* nailed it",
      "My jokes are critically acclaimed. By me.",
      "Ribbit ribbit! That's the whole bit! *honks horn*",
      "I'm on a roll. Literally. *rolls by*",
      "Comedy is my passion and also my calling and also my job.",
      "The funniest frog in the known world. I checked.",
      "STANDING OVATION. *claps own flippers*",
    ],
  },
  {
    type: 'chicken',
    name: 'Nugget',
    personality: "Small. Angry. Has back pain.",
    emoji: '🐔',
    dialogue: [
      "My back hurts.",
      "Don't ask. Back.",
      "Small but furious.",
      "I am fine. My back is not fine.",
      "The indignity of it all.",
      "Nugget does not forget.",
      "I have been through things.",
      "Respect. Immediately.",
    ],
  },
  {
    type: 'horse',
    name: 'Clover',
    personality: "Zero willpower around sweet treats.",
    emoji: '🐴',
    dialogue: [
      "I said I wouldn't. *eats sugar cube*",
      "One more. Just one more.",
      "This is the last one. I mean it this time.",
      "I have no regrets. I have many regrets.",
      "The treats find me. I don't seek them out. They find me.",
      "Willpower is overrated, actually.",
      "I made a deal with myself. I broke it immediately.",
      "Sweet. Everything is sweet. Life is sweet. *eats another*",
    ],
  },
]

export function getAnimalConfig(type: AnimalType): AnimalConfig {
  const config = ANIMAL_TYPES.find(a => a.type === type)
  if (!config) throw new Error(`Unknown animal type: ${type}`)
  return config
}

export function getAnimalDialogue(type: AnimalType, level: number): string {
  const config = getAnimalConfig(type)
  // level is 1-indexed; dialogue array is 0-indexed
  return config.dialogue[Math.max(0, Math.min(7, level - 1))]
}

export function getAnimalName(type: AnimalType): string {
  return getAnimalConfig(type).name
}

export function getAnimalPersonality(type: AnimalType): string {
  return getAnimalConfig(type).personality
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/animals.test.ts
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add __tests__/animals.test.ts src/lib/animals.ts
git commit -m "feat: add animals content file with 8 characters and dialogue"
```

---

## Task 3: Rename Types, Constants, and Game Logic

**Files:**
- Modify: `src/store/types.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/game-logic.ts`
- Modify: `__tests__/game-logic.test.ts`

- [ ] **Step 1: Update `src/store/types.ts`**

Replace entire file:

```typescript
import { AnimalType } from '@/lib/animals'

export type { AnimalType }
export type AnimalStatus = 'active' | 'wilting'
export type YieldSource = 'jupiter' | 'voltr'

export interface Animal {
  id: string
  type: AnimalType
  totalValue: number
  depositValue: number
  yieldEarned: number
  uncollectedYield: number
  level: number
  pendingLevelUp: boolean
  status: AnimalStatus
  wiltingStartedAt: number | null
  yieldSource: YieldSource
  createdAt: number
}

export interface CrewState {
  animals: Animal[]
  tokens: number
  lastVisitAt: number | null
  spawnTimestamps: number[]
  prosperityValue: number
}

export interface AnimalTypeConfig {
  type: AnimalType
  name: string
  emoji: string
  unlockProsperity: number
}
```

- [ ] **Step 2: Update `src/lib/constants.ts`**

Replace entire file:

```typescript
import { AnimalTypeConfig } from '@/store/types'

export const LEVEL_THRESHOLDS = [20, 40, 80, 160, 320, 640, 1280, 2560] as const
export const MAX_LEVEL = 8
export const MIN_DEPOSIT = 1
export const MAX_ANIMALS = 20
export const MAX_SPAWNS_PER_DAY = 2
export const SPAWN_WINDOW_MS = 24 * 60 * 60 * 1000
export const WILT_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000
export const TOKENS_PER_DOLLAR = 10

export const ANIMAL_TYPE_CONFIGS: AnimalTypeConfig[] = [
  { type: 'cow',     name: 'Bessie',       emoji: '🐄', unlockProsperity: 0 },
  { type: 'pig',     name: 'Sir Reginald', emoji: '🐷', unlockProsperity: 0 },
  { type: 'duck',    name: 'Gerald',       emoji: '🦆', unlockProsperity: 0 },
  { type: 'dog',     name: 'Biscuit',      emoji: '🐶', unlockProsperity: 0 },
  { type: 'sheep',   name: 'Wooly',        emoji: '🐑', unlockProsperity: 0 },
  { type: 'frog',    name: 'Ribbit',       emoji: '🐸', unlockProsperity: 0 },
  { type: 'chicken', name: 'Nugget',       emoji: '🐔', unlockProsperity: 0 },
  { type: 'horse',   name: 'Clover',       emoji: '🐴', unlockProsperity: 0 },
]

export const STARTER_ANIMAL_TYPES = ANIMAL_TYPE_CONFIGS.filter(a => a.unlockProsperity === 0)

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
```

- [ ] **Step 3: Update `src/lib/game-logic.ts`**

Replace entire file:

```typescript
import { Animal, AnimalTypeConfig } from '@/store/types'
import { LEVEL_THRESHOLDS, MAX_LEVEL, MIN_DEPOSIT, MAX_ANIMALS, MAX_SPAWNS_PER_DAY, SPAWN_WINDOW_MS, TOKENS_PER_DOLLAR, ANIMAL_TYPE_CONFIGS } from './constants'

export function calculateLevel(totalValue: number): number {
  if (totalValue < LEVEL_THRESHOLDS[0]) return 0
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalValue >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 0
}

export function canSpawnAnimal(animals: Animal[], spawnTimestamps: number[], now: number): boolean {
  if (animals.length >= MAX_ANIMALS) return false
  const recentSpawns = spawnTimestamps.filter(t => now - t < SPAWN_WINDOW_MS)
  return recentSpawns.length < MAX_SPAWNS_PER_DAY
}

export function canMergeAnimals(a: Animal, b: Animal): boolean {
  if (a.id === b.id) return false
  if (a.type !== b.type) return false
  if (a.level !== b.level) return false
  if (a.level >= MAX_LEVEL) return false
  return true
}

export function calculateProsperity(animals: Animal[]): number {
  return animals.reduce((sum, a) => sum + a.totalValue, 0)
}

export function calculateTokensFromYield(yieldAmount: number): number {
  return Math.floor(yieldAmount * TOKENS_PER_DOLLAR)
}

export function getAvailableAnimalTypes(prosperity: number): AnimalTypeConfig[] {
  return ANIMAL_TYPE_CONFIGS.filter(a => prosperity >= a.unlockProsperity)
}

export function validateDeposit(amount: number, action: 'spawn' | 'upgrade'): { valid: boolean; error?: string } {
  if (amount <= 0) return { valid: false, error: 'Deposit must be greater than zero' }
  if (action === 'spawn' && amount < MIN_DEPOSIT) {
    return { valid: false, error: `Minimum $${MIN_DEPOSIT} deposit required for a new crew member` }
  }
  return { valid: true }
}
```

- [ ] **Step 4: Update `__tests__/game-logic.test.ts`**

Replace entire file:

```typescript
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
  it('returns 1 for exactly 20', () => {
    expect(calculateLevel(20)).toBe(1)
  })

  it('returns 1 for 39', () => {
    expect(calculateLevel(39)).toBe(1)
  })

  it('returns 2 for 40', () => {
    expect(calculateLevel(40)).toBe(2)
  })

  it('returns 4 for 160', () => {
    expect(calculateLevel(160)).toBe(4)
  })

  it('returns 8 for 2560', () => {
    expect(calculateLevel(2560)).toBe(8)
  })

  it('caps at 8 for values above max threshold', () => {
    expect(calculateLevel(50000)).toBe(8)
  })

  it('returns 0 for values below min threshold', () => {
    expect(calculateLevel(10)).toBe(0)
  })
})

describe('canSpawnAnimal', () => {
  const now = Date.now()

  it('allows spawn when crew is empty', () => {
    expect(canSpawnAnimal([], [], now)).toBe(true)
  })

  it('blocks spawn when at 20 animals', () => {
    const animals = Array.from({ length: 20 }, (_, i) =>
      makeAnimal({ id: `a-${i}` })
    )
    expect(canSpawnAnimal(animals, [], now)).toBe(false)
  })

  it('blocks spawn when 2 spawns occurred in last 24h', () => {
    const recentTimestamps = [now - 1000, now - 2000]
    expect(canSpawnAnimal([], recentTimestamps, now)).toBe(false)
  })

  it('allows spawn when previous spawns are older than 24h', () => {
    const oldTimestamps = [now - SPAWN_WINDOW_MS - 1000, now - SPAWN_WINDOW_MS - 2000]
    expect(canSpawnAnimal([], oldTimestamps, now)).toBe(true)
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

describe('getAvailableAnimalTypes', () => {
  it('returns all 8 types at prosperity 0', () => {
    const types = getAvailableAnimalTypes(0)
    expect(types).toHaveLength(8)
  })

  it('returns all 8 types at high prosperity', () => {
    const types = getAvailableAnimalTypes(3000)
    expect(types).toHaveLength(8)
  })
})

describe('validateDeposit', () => {
  it('accepts $1 for spawn (MIN_DEPOSIT)', () => {
    const result = validateDeposit(1, 'spawn')
    expect(result.valid).toBe(true)
  })

  it('rejects $0 for spawn', () => {
    const result = validateDeposit(0, 'spawn')
    expect(result.valid).toBe(false)
  })

  it('accepts $1 for upgrade', () => {
    const result = validateDeposit(1, 'upgrade')
    expect(result.valid).toBe(true)
  })

  it('rejects $0 for any action', () => {
    expect(validateDeposit(0, 'spawn').valid).toBe(false)
    expect(validateDeposit(0, 'upgrade').valid).toBe(false)
  })
})
```

- [ ] **Step 5: Run all tests — should pass**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/store/types.ts src/lib/constants.ts src/lib/game-logic.ts __tests__/game-logic.test.ts
git commit -m "refactor: rename building→animal throughout types, constants, and game-logic"
```

---

## Task 4: DB Schema + Migration

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `src/lib/db/migrations/0001_animal_rename.sql`

- [ ] **Step 1: Create migration SQL**

Create `src/lib/db/migrations/0001_animal_rename.sql`:

```sql
ALTER TABLE cards RENAME COLUMN building_type TO animal_type;
```

- [ ] **Step 2: Update `src/lib/db/schema.ts`**

Change `building_type` to `animal_type` in the cards table definition:

```typescript
// In the cards table, change:
building_type: text('building_type').notNull(),
// To:
animal_type: text('animal_type').notNull(),
```

Full updated cards table:
```typescript
export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  wallet_address: text('wallet_address').notNull().references(() => users.wallet_address),
  animal_type: text('animal_type').notNull(),
  level: integer('level').notNull().default(1),
  created_at: timestamp('created_at').defaultNow().notNull(),
})
```

- [ ] **Step 3: Run the migration (against dev/staging DB)**

```bash
# Run against your Railway DB:
DATABASE_URL=<your-railway-url> npx drizzle-kit migrate
```

> **Note:** If no live DB is available yet, skip this step and run it when setting up Railway (documented in project_pwa_rebuild_status.md).

- [ ] **Step 4: Type-check to catch schema ripple effects**

```bash
npm run build 2>&1 | head -40
```
Expected: errors on any code still referencing `building_type` — these get fixed in Task 5.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/migrations/0001_animal_rename.sql
git commit -m "feat: rename building_type → animal_type in DB schema and migration"
```

---

## Task 5: Update API Routes + Image Helper

**Files:**
- Modify: `src/app/api/packs/[id]/open/route.ts`
- Modify: `src/app/api/cards/merge/route.ts`
- Create: `src/lib/animal-images.ts`
- Delete: `src/lib/building-images.ts`
- Modify: `src/__tests__/api/merge.test.ts`
- Modify: `src/__tests__/api/packs.test.ts`

- [ ] **Step 1: Update `src/app/api/packs/[id]/open/route.ts`**

Replace entire file:

```typescript
import { NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, packs, cards } from '@/lib/db'
import { ANIMAL_TYPE_CONFIGS } from '@/lib/constants'

export const POST = withAuth(async (_req, { walletAddress, params }) => {
  const packId = params?.id
  if (!packId) return NextResponse.json({ error: 'Pack ID required' }, { status: 400 })

  const [pack] = await db.select().from(packs).where(
    and(eq(packs.id, packId), eq(packs.wallet_address, walletAddress), isNull(packs.opened_at))
  )
  if (!pack) return NextResponse.json({ error: 'Pack not found or already opened' }, { status: 404 })

  const animalType = ANIMAL_TYPE_CONFIGS[Math.floor(Math.random() * ANIMAL_TYPE_CONFIGS.length)].type

  const [card] = await db.insert(cards)
    .values({ wallet_address: walletAddress, animal_type: animalType, level: 1 })
    .returning()

  await db.update(packs)
    .set({ card_id: card.id, opened_at: new Date() })
    .where(eq(packs.id, packId))

  return NextResponse.json({ card, pack: { ...pack, card_id: card.id, opened_at: new Date() } })
})
```

- [ ] **Step 2: Update `src/app/api/cards/merge/route.ts`**

Replace entire file:

```typescript
import { NextResponse } from 'next/server'
import { and, eq, or } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'
import { db, cards, packs } from '@/lib/db'
import { canMergeAnimals } from '@/lib/game-logic'

export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const { cardId1, cardId2 } = body

  if (!cardId1 || !cardId2) {
    return NextResponse.json({ error: 'cardId1 and cardId2 required' }, { status: 400 })
  }

  const [c1] = await db.select().from(cards).where(and(eq(cards.id, cardId1), eq(cards.wallet_address, walletAddress)))
  const [c2] = await db.select().from(cards).where(and(eq(cards.id, cardId2), eq(cards.wallet_address, walletAddress)))

  if (!c1 || !c2) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const a1 = { id: c1.id, type: c1.animal_type, level: c1.level, totalValue: 0 }
  const a2 = { id: c2.id, type: c2.animal_type, level: c2.level, totalValue: 0 }

  if (!canMergeAnimals(a1 as any, a2 as any)) {
    return NextResponse.json({ error: 'Animals cannot be merged (different type, level, or max level reached)' }, { status: 422 })
  }

  await db.update(packs).set({ card_id: null }).where(or(eq(packs.card_id, cardId1), eq(packs.card_id, cardId2)))
  await db.delete(cards).where(or(eq(cards.id, cardId1), eq(cards.id, cardId2)))

  const [merged] = await db.insert(cards)
    .values({ wallet_address: walletAddress, animal_type: c1.animal_type, level: c1.level + 1 })
    .returning()

  return NextResponse.json({ card: merged })
})
```

- [ ] **Step 3: Create `src/lib/animal-images.ts`**

```typescript
import { ANIMAL_TYPE_CONFIGS } from './constants'
import { AnimalType } from './animals'

const EMOJI_MAP: Record<string, string> = {}
for (const a of ANIMAL_TYPE_CONFIGS) {
  EMOJI_MAP[a.type] = a.emoji
}

// Add to this set as art assets are dropped in public/animals/{type}/level-{n}.png
const HAS_IMAGE = new Set<string>([
  // e.g. 'cow-1', 'cow-2' when /public/animals/cow/level-1.png exists
])

export function getAnimalEmoji(animalType: string): string {
  return EMOJI_MAP[animalType] ?? '🐾'
}

export function getAnimalImage(animalType: string, level: number): string | null {
  if (!HAS_IMAGE.has(`${animalType}-${level}`)) return null
  return `/animals/${animalType}/level-${level}.png`
}
```

- [ ] **Step 4: Update `src/__tests__/api/merge.test.ts`**

Change `makeCard` to use `animal_type` and valid animal type values:

```typescript
// Replace the makeCard helper:
const makeCard = (id: string, level = 1, type = 'cow') => ({
  id, wallet_address: 'wallet123', animal_type: type, level, created_at: new Date(),
})
```

Also update the "different types" test to use animal types:
```typescript
// In the 422 test, change:
if (selectCallCount === 1) return Promise.resolve([makeCard('card-1', 1, 'cow')])
return Promise.resolve([makeCard('card-2', 1, 'dog')])
```

- [ ] **Step 5: Update `src/__tests__/api/packs.test.ts`**

Change `mockCard` to use `animal_type` and update description:

```typescript
// Replace mockCard:
const mockCard = { id: 'card-1', wallet_address: 'wallet123', animal_type: 'cow', level: 1, created_at: new Date() }
```

Update the test description:
```typescript
// Change:
it('reveals a building card at level 1 and marks pack as opened', ...
// To:
it('reveals an animal card at level 1 and marks pack as opened', ...
```

- [ ] **Step 6: Delete `src/lib/building-images.ts`**

```bash
rm src/lib/building-images.ts
```

- [ ] **Step 7: Type-check**

```bash
npm run build 2>&1 | head -40
```
Expected: errors on files still importing from `building-images` — fixed in Task 6.

- [ ] **Step 8: Run tests**

```bash
npm test
```
Expected: all tests pass (merge and packs tests now use animal_type).

- [ ] **Step 9: Commit**

```bash
git add src/app/api/packs src/app/api/cards src/lib/animal-images.ts src/__tests__/api/merge.test.ts src/__tests__/api/packs.test.ts
git rm src/lib/building-images.ts
git commit -m "refactor: update API routes, image helpers, and API tests for animal theme"
```

---

## Task 6: Home Page — Your Crew

**Files:**
- Modify: `src/app/page.tsx`

The home page uses `building_type`, `getBuildingEmoji`, "Your Village", "No buildings yet" etc. RaccoonEvent wiring is done in Task 10 when the component exists — do not add it here.

- [ ] **Step 1: Update all building references in `src/app/page.tsx`**

Key changes (read the file first, then apply):

1. Import `getAnimalEmoji, getAnimalImage` from `@/lib/animal-images` instead of building-images
2. Change type annotation: `building_type: string` → `animal_type: string`
3. Change `card.building_type` → `card.animal_type` everywhere
4. "Your Village" → **"Your Crew"**
5. "No buildings yet" → **"No crew yet"**
6. "Deposit $20 USDC to unlock your first building!" → **"Deposit $20 to meet your first crew member!"**
7. "Add to Village" in open-pack button → handled in Task 7
8. Progress bar label "until next pack" stays, milestone math already uses $20

Animal card grid — each card currently shows `getBuildingEmoji(card.building_type)`. Update to:
```tsx
// Card display in grid (find the grid card JSX):
const img = getAnimalImage(card.animal_type, card.level)
// then:
{img
  ? <img src={img} alt={card.animal_type} className="w-full h-full object-contain" />
  : <span className="text-5xl">{getAnimalEmoji(card.animal_type)}</span>
}
```

Card navigation: update link href from `/building/${card.id}` to `/animal/${card.id}`.

- [ ] **Step 2: Type-check**

```bash
npm run build 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: home page — Your Crew, animal card grid"
```

---

## Task 7: Animal Detail Page

**Files:**
- Create: `src/app/animal/[id]/page.tsx`
- Delete: `src/app/building/` (whole directory)

The new animal detail page is simpler than the old building detail — no stats, just personality and dialogue.

- [ ] **Step 1: Create `src/app/animal/[id]/page.tsx`**

```tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getPortfolio, mergeCards } from '@/lib/client-api'
import { getAnimalEmoji, getAnimalImage } from '@/lib/animal-images'
import { getAnimalName, getAnimalPersonality, getAnimalDialogue } from '@/lib/animals'
import type { AnimalType } from '@/lib/animals'

type Card = { id: string; animal_type: string; level: number }

export default function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { ready, getAccessToken } = useAuth()
  const [card, setCard] = useState<Card | null>(null)
  const [sameCards, setSameCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [isMerging, setIsMerging] = useState(false)
  const [mergeStep, setMergeStep] = useState<'idle' | 'spinning' | 'reveal'>('idle')
  const [mergedCard, setMergedCard] = useState<Card | null>(null)

  useEffect(() => {
    if (!ready) return
    async function load() {
      try {
        const token = await getAccessToken()
        if (!token) return
        const portfolio = await getPortfolio(token)
        const found = portfolio.cards.find((c: Card) => c.id === id)
        if (!found) { router.replace('/'); return }
        setCard(found)
        setSameCards(portfolio.cards.filter((c: Card) =>
          c.id !== id && c.animal_type === found.animal_type && c.level === found.level
        ))
      } catch (err) {
        console.error('Failed to load animal:', err)
        router.replace('/')
      } finally { setLoading(false) }
    }
    load()
  }, [id, router, ready, getAccessToken])

  const handleMerge = async () => {
    if (!card || sameCards.length === 0) return
    setIsMerging(true); setMergeStep('spinning')
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const token = await getAccessToken()
      const result = await mergeCards(token!, card.id, sameCards[0].id)
      setMergedCard(result.card); setMergeStep('reveal')
      await new Promise(resolve => setTimeout(resolve, 2500))
      router.replace('/')
    } catch (err) {
      console.error('Merge failed:', err)
      alert('Merge failed. Please try again.')
      setIsMerging(false); setMergeStep('idle')
    }
  }

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6CB4E8]/30 border-t-[#6CB4E8] rounded-full animate-spin" />
      </div>
    )
  }

  if (!card) return null
  const canMerge = sameCards.length > 0 && card.level < 8
  const animalType = card.animal_type as AnimalType
  const img = getAnimalImage(card.animal_type, card.level)

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {/* Merge Animation Overlay */}
      {mergeStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/60 backdrop-blur-md">
          <div className="bg-[#FBF8F2] rounded-3xl p-12 shadow-2xl max-w-md mx-6 border-2 border-[#1A1A1A]/10">
            {mergeStep === 'spinning' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-8" style={{ fontFamily: 'Fredoka' }}>Combining...</h3>
                <div className="flex items-center justify-center gap-8 mb-8 relative">
                  <div className="animate-spin-slow">
                    <div className="w-28 h-28 bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#1A1A1A]/10">
                      <span className="text-5xl">{getAnimalEmoji(card.animal_type)}</span>
                    </div>
                    <div className="mt-2 bg-[#6CB4E8] rounded-full px-3 py-1 mx-auto w-fit"><span className="text-xs font-bold text-white">Lv.{card.level}</span></div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#F0C430] rounded-full flex items-center justify-center shadow-lg z-10 animate-pulse border-2 border-[#1A1A1A]/10">
                    <span className="text-[#1A1A1A] font-bold text-xl">+</span>
                  </div>
                  <div className="animate-spin-slow" style={{ animationDirection: 'reverse' }}>
                    <div className="w-28 h-28 bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#1A1A1A]/10">
                      <span className="text-5xl">{getAnimalEmoji(card.animal_type)}</span>
                    </div>
                    <div className="mt-2 bg-[#6CB4E8] rounded-full px-3 py-1 mx-auto w-fit"><span className="text-xs font-bold text-white">Lv.{card.level}</span></div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-[#F0C430]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <Sparkles className="w-6 h-6 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <Sparkles className="w-5 h-5 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {mergeStep === 'reveal' && mergedCard && (
              <div className="text-center animate-scale-in">
                <h3 className="text-3xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: 'Fredoka' }}>Leveled up!</h3>
                <div className="mb-6">
                  <div className="w-40 h-40 mx-auto bg-gradient-to-br from-[#6CB4E8]/20 to-[#F0C430]/20 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-[#F0C430]/40 relative animate-bounce-in">
                    {getAnimalImage(mergedCard.animal_type, mergedCard.level)
                      ? <img src={getAnimalImage(mergedCard.animal_type, mergedCard.level)!} alt={mergedCard.animal_type} className="w-full h-full object-contain" />
                      : <span className="text-[80px]">{getAnimalEmoji(mergedCard.animal_type)}</span>
                    }
                    <div className="absolute -top-3 -right-3 bg-[#F0C430] rounded-xl px-3 py-1 border-4 border-[#FBF8F2] shadow-lg">
                      <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Lv.{mergedCard.level}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xl font-bold text-[#6CB4E8] mb-2" style={{ fontFamily: 'Fredoka' }}>{getAnimalName(mergedCard.animal_type as AnimalType)}</p>
                <p className="text-[#1A1A1A]/50">Now Level {mergedCard.level}!</p>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="bg-[#FBF8F2] border-b-2 border-[#1A1A1A]/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center hover:bg-[#EDE8DC] transition-colors border-2 border-[#1A1A1A]/8">
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>{getAnimalName(animalType)}</h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">Level {card.level}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        {/* Animal image */}
        <div className="bg-[#FBF8F2] rounded-3xl p-8 shadow-lg border-2 border-[#1A1A1A]/8 mb-6">
          <div className="aspect-square bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-2xl overflow-hidden flex items-center justify-center mb-6 relative">
            {img
              ? <img src={img} alt={animalType} className="w-full h-full object-contain" />
              : <span className="text-[120px]">{getAnimalEmoji(card.animal_type)}</span>
            }
            <div className="absolute top-4 right-4 bg-[#F0C430] rounded-xl px-4 py-2 shadow-lg border-2 border-[#1A1A1A]/10">
              <span className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Lv.{card.level}</span>
            </div>
          </div>
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: 'Fredoka' }}>{getAnimalName(animalType)}</h2>
            <p className="text-sm text-[#1A1A1A]/40 font-medium">{getAnimalPersonality(animalType)}</p>
          </div>
          {/* Speech bubble */}
          <div className="bg-[#F5F0E8] rounded-2xl px-5 py-4 border-2 border-[#1A1A1A]/8">
            <p className="text-[#1A1A1A]/80 text-sm font-medium italic">
              "{getAnimalDialogue(animalType, card.level)}"
            </p>
          </div>
        </div>

        {canMerge && (
          <div className="bg-[#FBF8F2] rounded-3xl p-6 shadow-lg border-2 border-[#1A1A1A]/8">
            <div className="bg-[#F0C430]/20 rounded-2xl p-4 border-2 border-[#F0C430]/30">
              <p className="text-sm text-[#1A1A1A]/70 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F0C430]" />
                You have a matching {getAnimalName(animalType)}! Ready to combine.
              </p>
            </div>
          </div>
        )}
      </main>

      {canMerge && (
        <div className="sticky bottom-0 bg-[#FBF8F2] border-t-2 border-[#1A1A1A]/5 px-6 py-4">
          <button onClick={handleMerge} disabled={isMerging}
            className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all border-2 ${
              !isMerging ? 'bg-[#6CB4E8] text-white border-[#1A1A1A]/10 hover:shadow-xl active:scale-95' : 'bg-[#EDE8DC] text-[#1A1A1A]/30 border-[#1A1A1A]/5 cursor-not-allowed'
            }`}>
            {isMerging ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Combining...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2"><Sparkles className="w-5 h-5" />Combine 2 {getAnimalName(animalType)}s</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Delete old building page**

```bash
rm -rf src/app/building
```

- [ ] **Step 3: Type-check**

```bash
npm run build 2>&1 | head -40
```

- [ ] **Step 4: Commit**

```bash
git add src/app/animal
git rm -r src/app/building
git commit -m "feat: animal detail page with personality, dialogue, and merge"
```

---

## Task 8: Update Open-Pack Page

**Files:**
- Modify: `src/app/open-pack/page.tsx`

- [ ] **Step 1: Update all building references**

Key changes:
1. Import `getAnimalEmoji, getAnimalImage` from `@/lib/animal-images` (remove building-images import)
2. Type: `building_type: string` → `animal_type: string`
3. `getBuildingEmoji(revealedCard.building_type)` → `getAnimalEmoji(revealedCard.animal_type)`
4. `getBuildingImage(revealedCard.building_type)` → `getAnimalImage(revealedCard.animal_type, revealedCard.level)`
5. `getBuildingName(revealedCard.building_type)` → `getAnimalName(revealedCard.animal_type as AnimalType)` (import from `@/lib/animals`)
6. "Building Pack" → **"Crew Pack"**
7. "Contains 1 random building" → **"Contains 1 new crew member"**
8. "NEW BUILDING!" → **"NEW CREW MEMBER!"**
9. "Level {n} Building" → **"Level {n}"**
10. "Add to Village" (the final button) → **"Meet the Crew"**

- [ ] **Step 2: Type-check**

```bash
npm run build 2>&1 | head -40
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/open-pack/page.tsx
git commit -m "feat: update open-pack page for animal theme"
```

---

## Task 9: IntroDialogue Component

**Files:**
- Create: `src/components/IntroDialogue.tsx`
- Modify: `src/app/open-pack/page.tsx` (wire it in after pack reveal)

The intro dialogue appears the first time a user receives a given animal type.

- [ ] **Step 1: Create `src/components/IntroDialogue.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { AnimalType } from '@/lib/animals'
import { getAnimalName, getAnimalDialogue } from '@/lib/animals'
import { getAnimalEmoji, getAnimalImage } from '@/lib/animal-images'

interface Props {
  animalType: AnimalType
  level: number
  onDismiss: () => void
}

export function IntroDialogue({ animalType, level, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slight delay so the slide-up animation triggers after mount
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const img = getAnimalImage(animalType, level)
  const dialogue = getAnimalDialogue(animalType, 1) // always show level-1 intro line

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1A1A1A]/40" />

      {/* Overlay panel */}
      <div
        className={`relative w-full bg-[#FBF8F2] rounded-t-3xl border-t-2 border-[#1A1A1A]/8 shadow-2xl transition-transform duration-500 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-4 p-6 pb-2" style={{ minHeight: 200 }}>
          {/* Speech bubble */}
          <div className="flex-1 bg-[#F5F0E8] rounded-2xl p-5 border-2 border-[#1A1A1A]/8 flex flex-col justify-center">
            <p className="text-sm font-semibold text-[#1A1A1A]/50 mb-2">{getAnimalName(animalType)}</p>
            <p className="text-[#1A1A1A] font-medium italic">"{dialogue}"</p>
          </div>

          {/* Animal face — zoomed/cropped */}
          <div className="w-40 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] border-2 border-[#1A1A1A]/8 flex items-center justify-center">
            {img
              ? <img src={img} alt={animalType} className="w-full h-full object-cover object-top" />
              : <span className="text-7xl">{getAnimalEmoji(animalType)}</span>
            }
          </div>
        </div>

        <p
          className="text-center text-xs text-[#1A1A1A]/40 font-medium py-4 cursor-pointer"
          onClick={onDismiss}
        >
          Tap anywhere to continue
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire IntroDialogue into open-pack page**

In `src/app/open-pack/page.tsx`, after the pack is revealed:

1. Add state: `const [showIntro, setShowIntro] = useState(false)`
2. In `handleOpenPack`, after `setRevealedCard(result.card)` and before `setStage('revealed')`:
```tsx
// Check if user has seen this animal before
const seenKey = `intro_seen_${result.card.animal_type}`
if (!localStorage.getItem(seenKey)) {
  setShowIntro(true)
}
```
3. Add `IntroDialogue` to the JSX, rendered when `showIntro && revealedCard`:
```tsx
{showIntro && revealedCard && (
  <IntroDialogue
    animalType={revealedCard.animal_type as AnimalType}
    level={revealedCard.level}
    onDismiss={() => {
      localStorage.setItem(`intro_seen_${revealedCard.animal_type}`, '1')
      setShowIntro(false)
    }}
  />
)}
```

- [ ] **Step 3: Type-check**

```bash
npm run build 2>&1 | head -40
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/IntroDialogue.tsx src/app/open-pack/page.tsx
git commit -m "feat: intro dialogue component for first animal encounter"
```

---

## Task 10: RaccoonEvent Component

**Files:**
- Create: `src/components/RaccoonEvent.tsx`
- Modify: `src/app/page.tsx` (wire it in)

Shows when the user's last deposit was 7+ days ago and they have ≥ 1 animal.

- [ ] **Step 1: Create `src/components/RaccoonEvent.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'

interface Props {
  lastDepositAt: Date | null // null = never deposited
  hasAnimals: boolean
}

function shouldShowRaccoon(lastDepositAt: Date | null, hasAnimals: boolean): boolean {
  if (!hasAnimals) return false
  if (!lastDepositAt) return false
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return Date.now() - lastDepositAt.getTime() > sevenDaysMs
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10) // "2026-03-17"
}

export function RaccoonEvent({ lastDepositAt, hasAnimals }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!shouldShowRaccoon(lastDepositAt, hasAnimals)) return
    const dismissed = localStorage.getItem('raccoon_dismissed_date')
    if (dismissed === getTodayString()) return
    setVisible(true)
  }, [lastDepositAt, hasAnimals])

  const dismiss = () => {
    localStorage.setItem('raccoon_dismissed_date', getTodayString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="mx-4 mb-4 bg-[#FBF8F2] rounded-2xl border-2 border-[#1A1A1A]/8 p-4 flex items-center gap-4 cursor-pointer shadow-md"
      onClick={dismiss}
    >
      {/* Raccoon animation */}
      <div className="text-4xl animate-bounce flex-shrink-0">🦝</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1A1A1A] mb-0.5">A visitor appeared...</p>
        <p className="text-xs text-[#1A1A1A]/50 italic">one man's trash is another man's treasure</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); dismiss() }}
        className="text-[#1A1A1A]/30 text-lg flex-shrink-0"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Wire RaccoonEvent into `src/app/page.tsx`**

The portfolio API already returns `cards` and deposit data. We need the last deposit date. Currently the API doesn't return it directly — simplest approach: derive it from the portfolio stats or add it to the API response.

**Option (no API change needed):** Track last deposit date in the portfolio response. The portfolio route already queries deposits — add `lastDepositAt` to the response:

In `src/app/api/portfolio/route.ts`:
```typescript
// 1. Import desc from drizzle-orm (add to existing import):
import { and, eq, isNull, sum, desc } from 'drizzle-orm'

// 2. Replace the destructuring + Promise.all with:
const [userCards, unopenedPacks, depositResult, positionUsdc, apyPercent, latestDeposit] = await Promise.all([
  db.select().from(cards).where(eq(cards.wallet_address, walletAddress)),
  db.select().from(packs).where(
    and(eq(packs.wallet_address, walletAddress), isNull(packs.opened_at))
  ),
  db.select({ total: sum(deposits.amount_usdc) })
    .from(deposits)
    .where(eq(deposits.wallet_address, walletAddress)),
  readPosition(walletAddress).catch(() => 0),
  readApy().catch(() => 0),
  db.select({ created_at: deposits.created_at })
    .from(deposits)
    .where(eq(deposits.wallet_address, walletAddress))
    .orderBy(desc(deposits.created_at))
    .limit(1),
])

// 3. Add lastDepositAt to the response JSON:
lastDepositAt: latestDeposit[0]?.created_at ?? null,
```

In `src/app/page.tsx`:
1. Import `RaccoonEvent`
2. In the JSX, add above the crew grid:
```tsx
<RaccoonEvent
  lastDepositAt={portfolio?.lastDepositAt ? new Date(portfolio.lastDepositAt) : null}
  hasAnimals={(portfolio?.cards?.length ?? 0) > 0}
/>
```

- [ ] **Step 3: Type-check**

```bash
npm run build 2>&1 | head -40
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/RaccoonEvent.tsx src/app/page.tsx src/app/api/portfolio/route.ts
git commit -m "feat: raccoon event for lapsed deposits"
```

---

## Final: Build Verification

- [ ] **Step 1: Full build**

```bash
npm run build
```
Expected: exits 0, no type errors.

- [ ] **Step 2: Run all tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 3: Final commit if any cleanup needed**

```bash
git add -A && git commit -m "chore: cleanup after animal theme overhaul"
```
