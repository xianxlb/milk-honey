# Backend API Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Next.js API routes + SQLite backend for the gamified DeFi savings hackathon demo.

**Architecture:** Next.js API routes with `better-sqlite3` for persistence. A shared `db.ts` module initializes the SQLite database and exports prepared-statement helpers. Each API route is a thin handler that validates input, calls db helpers, and returns JSON.

**Tech Stack:** Next.js 16 API routes, better-sqlite3, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-03-14-backend-api-design.md`

---

## File Structure

```
src/
├── lib/
│   └── db.ts                           # SQLite connection, schema init, query helpers
├── app/api/
│   ├── cities/
│   │   └── route.ts                    # POST /api/cities
│   ├── cities/[cityId]/
│   │   └── portfolio/route.ts          # GET /api/cities/:cityId/portfolio
│   ├── deposit/
│   │   └── route.ts                    # POST /api/deposit
│   ├── packs/[packId]/
│   │   └── open/route.ts              # POST /api/packs/:packId/open
│   ├── cards/
│   │   └── merge/route.ts             # POST /api/cards/merge
│   └── referral/[cityId]/
│       └── route.ts                    # GET /api/referral/:cityId
└── __tests__/
    └── api/
        ├── db.test.ts                  # DB helpers tests
        ├── cities.test.ts              # Cities endpoint tests
        ├── deposit.test.ts             # Deposit endpoint tests
        ├── packs.test.ts               # Pack opening tests
        ├── merge.test.ts               # Card merge tests
        ├── portfolio.test.ts           # Portfolio endpoint tests
        └── referral.test.ts            # Referral endpoint tests
```

---

## Chunk 1: Database Layer

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Install better-sqlite3**

Run: `npm install better-sqlite3 && npm install -D @types/better-sqlite3`

- [ ] **Step 2: Add database file to .gitignore**

Append `*.db` to `.gitignore`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add better-sqlite3 dependency"
```

---

### Task 2: Database module with schema init and helpers

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/__tests__/api/db.test.ts`

- [ ] **Step 1: Write failing tests for db helpers**

```typescript
// src/__tests__/api/db.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/api/db.test.ts`
Expected: FAIL — module `@/lib/db` not found

- [ ] **Step 3: Implement db.ts**

```typescript
// src/lib/db.ts
import Database from 'better-sqlite3'
import crypto from 'crypto'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'milk-honey.db')

let _db: Database.Database | null = null

export function getDb(dbPath?: string): Database.Database {
  if (dbPath === ':memory:') {
    const db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    initSchema(db)
    return db
  }
  if (!_db) {
    _db = new Database(dbPath ?? DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initSchema(_db)
  }
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      referred_by TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (referred_by) REFERENCES cities(id)
    );
    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL,
      building_type TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );
    CREATE TABLE IF NOT EXISTS packs (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL,
      card_id TEXT,
      created_at INTEGER NOT NULL,
      opened_at INTEGER,
      FOREIGN KEY (city_id) REFERENCES cities(id),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );
  `)
}

function uuid(): string {
  return crypto.randomUUID()
}

function now(): number {
  return Math.floor(Date.now() / 1000)
}

// --- Cities ---

export interface City {
  id: string
  name: string
  referredBy: string | null
  createdAt: number
}

export function createCity(db: Database.Database, name: string, referredBy?: string): City {
  const city: City = { id: uuid(), name, referredBy: referredBy ?? null, createdAt: now() }
  db.prepare('INSERT INTO cities (id, name, referred_by, created_at) VALUES (?, ?, ?, ?)')
    .run(city.id, city.name, city.referredBy, city.createdAt)
  return city
}

export function getCityById(db: Database.Database, id: string): City | null {
  const row = db.prepare(
    'SELECT id, name, referred_by as referredBy, created_at as createdAt FROM cities WHERE id = ?'
  ).get(id) as City | undefined
  return row ?? null
}

// --- Deposits ---

export interface Deposit {
  id: string
  cityId: string
  amount: number
  createdAt: number
}

export function createDeposit(db: Database.Database, cityId: string, amountCents: number): Deposit {
  const deposit: Deposit = { id: uuid(), cityId, amount: amountCents, createdAt: now() }
  db.prepare('INSERT INTO deposits (id, city_id, amount, created_at) VALUES (?, ?, ?, ?)')
    .run(deposit.id, deposit.cityId, deposit.amount, deposit.createdAt)
  return deposit
}

export function getDepositsByCityId(db: Database.Database, cityId: string): Deposit[] {
  return db.prepare(
    'SELECT id, city_id as cityId, amount, created_at as createdAt FROM deposits WHERE city_id = ?'
  ).all(cityId) as Deposit[]
}

// --- Packs ---

export interface Pack {
  id: string
  cityId: string
  cardId: string | null
  createdAt: number
  openedAt: number | null
}

export function createPack(db: Database.Database, cityId: string): Pack {
  const pack: Pack = { id: uuid(), cityId, cardId: null, createdAt: now(), openedAt: null }
  db.prepare('INSERT INTO packs (id, city_id, card_id, created_at, opened_at) VALUES (?, ?, ?, ?, ?)')
    .run(pack.id, pack.cityId, pack.cardId, pack.createdAt, pack.openedAt)
  return pack
}

export function getPackById(db: Database.Database, id: string): Pack | null {
  const row = db.prepare(
    'SELECT id, city_id as cityId, card_id as cardId, created_at as createdAt, opened_at as openedAt FROM packs WHERE id = ?'
  ).get(id) as Pack | undefined
  return row ?? null
}

export function getUnopenedPacksByCityId(db: Database.Database, cityId: string): Pack[] {
  return db.prepare(
    'SELECT id, city_id as cityId, card_id as cardId, created_at as createdAt, opened_at as openedAt FROM packs WHERE city_id = ? AND card_id IS NULL'
  ).all(cityId) as Pack[]
}

export function openPack(db: Database.Database, packId: string, cardId: string): Pack {
  const openedAt = now()
  db.prepare('UPDATE packs SET card_id = ?, opened_at = ? WHERE id = ?')
    .run(cardId, openedAt, packId)
  return getPackById(db, packId)!
}

// --- Cards ---

export interface Card {
  id: string
  cityId: string
  buildingType: string
  level: number
  createdAt: number
}

export function createCard(
  db: Database.Database, cityId: string, buildingType: string, level: number
): Card {
  const card: Card = { id: uuid(), cityId, buildingType, level, createdAt: now() }
  db.prepare('INSERT INTO cards (id, city_id, building_type, level, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(card.id, card.cityId, card.buildingType, card.level, card.createdAt)
  return card
}

export function getCardById(db: Database.Database, id: string): Card | null {
  const row = db.prepare(
    'SELECT id, city_id as cityId, building_type as buildingType, level, created_at as createdAt FROM cards WHERE id = ?'
  ).get(id) as Card | undefined
  return row ?? null
}

export function getCardsByCityId(db: Database.Database, cityId: string): Card[] {
  return db.prepare(
    'SELECT id, city_id as cityId, building_type as buildingType, level, created_at as createdAt FROM cards WHERE city_id = ?'
  ).all(cityId) as Card[]
}

export function deleteCard(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM cards WHERE id = ?').run(id)
}

// --- Merge Validation ---

export function validateMerge(card1: Card, card2: Card): string | null {
  if (card1.cityId !== card2.cityId) return 'Cards belong to different cities'
  if (card1.buildingType !== card2.buildingType) return 'Cards must be the same type'
  if (card1.level !== card2.level) return 'Cards must be the same level'
  if (card1.level >= 8) return 'Cards are already at max level'
  return null
}

// --- Yield ---

export function calculateYieldCents(db: Database.Database, cityId: string): number {
  const deposits = getDepositsByCityId(db, cityId)
  const currentTime = now()
  let totalYield = 0
  for (const dep of deposits) {
    const elapsedSeconds = currentTime - dep.createdAt
    const elapsedYears = elapsedSeconds / (365 * 24 * 60 * 60)
    totalYield += dep.amount * 0.05 * elapsedYears
  }
  return Math.floor(totalYield)
}

export function getTotalDepositedCents(db: Database.Database, cityId: string): number {
  const row = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE city_id = ?'
  ).get(cityId) as { total: number }
  return row.total
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/db.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db.ts src/__tests__/api/db.test.ts
git commit -m "feat: add SQLite database layer with schema and helpers"
```

---

## Chunk 2: API Routes — Cities + Deposit

### Task 3: POST /api/cities

**Files:**
- Create: `src/app/api/cities/route.ts`
- Create: `src/__tests__/api/cities.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/api/cities.test.ts
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
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/cities.test.ts`

- [ ] **Step 3: Implement the route**

```typescript
// src/app/api/cities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb, createCity, getCityById } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, referralCode } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const db = getDb()

  if (referralCode) {
    const referrer = getCityById(db, referralCode)
    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }
  }

  const city = createCity(db, name.trim(), referralCode || undefined)
  return NextResponse.json({
    id: city.id,
    name: city.name,
    referralCode: city.id,
    createdAt: city.createdAt,
  }, { status: 201 })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cities/route.ts src/__tests__/api/cities.test.ts
git commit -m "feat: add POST /api/cities endpoint"
```

---

### Task 4: POST /api/deposit

**Files:**
- Create: `src/app/api/deposit/route.ts`
- Create: `src/__tests__/api/deposit.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/api/deposit.test.ts
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
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/deposit.test.ts`

- [ ] **Step 3: Implement the route**

```typescript
// src/app/api/deposit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb, getCityById, createDeposit, createPack } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cityId, amount } = body

  if (!cityId || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'cityId and positive amount required' }, { status: 400 })
  }

  const db = getDb()
  const city = getCityById(db, cityId)
  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 })
  }

  const amountCents = Math.round(amount * 100)
  const deposit = createDeposit(db, cityId, amountCents)
  const numPacks = Math.floor(amountCents / 10000) // 1 pack per $100

  const packs = []
  for (let i = 0; i < numPacks; i++) {
    packs.push(createPack(db, cityId))
  }

  return NextResponse.json({
    deposit: { id: deposit.id, amount: deposit.amount, createdAt: deposit.createdAt },
    packs: packs.map(p => ({ id: p.id, cardId: p.cardId, createdAt: p.createdAt })),
  }, { status: 201 })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/deposit/route.ts src/__tests__/api/deposit.test.ts
git commit -m "feat: add POST /api/deposit endpoint with pack generation"
```

---

## Chunk 3: API Routes — Pack Opening + Merge

### Task 5: POST /api/packs/:packId/open

**Files:**
- Create: `src/app/api/packs/[packId]/open/route.ts`
- Create: `src/__tests__/api/packs.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/api/packs.test.ts
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

  it('includes farm when prosperity >= $3000', () => {
    const types = new Set<string>()
    for (let i = 0; i < 100; i++) {
      types.add(pickRandomBuildingType(300000)) // $3000 in cents
    }
    expect(types.has('farm')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/packs.test.ts`

- [ ] **Step 3: Implement the route**

```typescript
// src/app/api/packs/[packId]/open/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb, getPackById, createCard, openPack, getTotalDepositedCents } from '@/lib/db'
import { BUILDING_TYPES } from '@/lib/constants'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params
  const db = getDb()

  const pack = getPackById(db, packId)
  if (!pack) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
  }
  if (pack.cardId !== null) {
    return NextResponse.json({ error: 'Pack already opened' }, { status: 400 })
  }

  const prosperityCents = getTotalDepositedCents(db, pack.cityId)
  const prosperityDollars = prosperityCents / 100
  const available = BUILDING_TYPES.filter(b => prosperityDollars >= b.unlockProsperity)
  const buildingType = available[Math.floor(Math.random() * available.length)].type

  const card = createCard(db, pack.cityId, buildingType, 0)
  const openedPack = openPack(db, pack.id, card.id)

  return NextResponse.json({
    pack: { id: openedPack.id, cardId: openedPack.cardId, openedAt: openedPack.openedAt },
    card: {
      id: card.id,
      buildingType: card.buildingType,
      level: card.level,
      createdAt: card.createdAt,
    },
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/packs.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/packs/[packId]/open/route.ts" src/__tests__/api/packs.test.ts
git commit -m "feat: add POST /api/packs/:packId/open endpoint"
```

---

### Task 6: POST /api/cards/merge

**Files:**
- Create: `src/app/api/cards/merge/route.ts`
- Create: `src/__tests__/api/merge.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/api/merge.test.ts
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
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/merge.test.ts`

- [ ] **Step 3: Implement the route**

```typescript
// src/app/api/cards/merge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb, getCardById, deleteCard, createCard, validateMerge } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cardId1, cardId2 } = body

  if (!cardId1 || !cardId2) {
    return NextResponse.json({ error: 'cardId1 and cardId2 required' }, { status: 400 })
  }

  const db = getDb()
  const card1 = getCardById(db, cardId1)
  const card2 = getCardById(db, cardId2)

  if (!card1 || !card2) {
    return NextResponse.json({ error: 'One or both cards not found' }, { status: 404 })
  }

  const mergeError = validateMerge(card1, card2)
  if (mergeError) {
    return NextResponse.json({ error: mergeError }, { status: 400 })
  }

  deleteCard(db, card1.id)
  deleteCard(db, card2.id)
  const merged = createCard(db, card1.cityId, card1.buildingType, card1.level + 1)

  return NextResponse.json({
    card: {
      id: merged.id,
      buildingType: merged.buildingType,
      level: merged.level,
      createdAt: merged.createdAt,
    },
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/merge.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cards/merge/route.ts src/__tests__/api/merge.test.ts
git commit -m "feat: add POST /api/cards/merge endpoint"
```

---

## Chunk 4: API Routes — Portfolio + Referral

### Task 7: GET /api/cities/:cityId/portfolio

**Files:**
- Create: `src/app/api/cities/[cityId]/portfolio/route.ts`
- Create: `src/__tests__/api/portfolio.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/api/portfolio.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDb, createCity, createDeposit, createCard, createPack,
  getTotalDepositedCents, calculateYieldCents, getCardsByCityId, getUnopenedPacksByCityId,
} from '@/lib/db'
import Database from 'better-sqlite3'

let db: Database.Database

beforeEach(() => {
  db = getDb(':memory:')
})

describe('portfolio data', () => {
  it('returns complete portfolio for a city', () => {
    const city = createCity(db, 'Test City')
    createDeposit(db, city.id, 20000) // $200
    createCard(db, city.id, 'flower-shop', 0)
    createCard(db, city.id, 'pet-shop', 1)
    createPack(db, city.id) // unopened

    const cards = getCardsByCityId(db, city.id)
    const packs = getUnopenedPacksByCityId(db, city.id)
    const totalDeposited = getTotalDepositedCents(db, city.id)
    const yieldEarned = calculateYieldCents(db, city.id)

    expect(cards).toHaveLength(2)
    expect(packs).toHaveLength(1)
    expect(totalDeposited).toBe(20000)
    expect(yieldEarned).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/portfolio.test.ts`

- [ ] **Step 3: Implement the route**

```typescript
// src/app/api/cities/[cityId]/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getDb, getCityById, getCardsByCityId, getUnopenedPacksByCityId,
  getTotalDepositedCents, calculateYieldCents,
} from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
  const { cityId } = await params
  const db = getDb()

  const city = getCityById(db, cityId)
  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 })
  }

  const cards = getCardsByCityId(db, cityId)
  const packs = getUnopenedPacksByCityId(db, cityId)
  const totalDepositedCents = getTotalDepositedCents(db, cityId)
  const yieldEarnedCents = calculateYieldCents(db, cityId)

  return NextResponse.json({
    city: { id: city.id, name: city.name, createdAt: city.createdAt },
    cards: cards.map(c => ({
      id: c.id, buildingType: c.buildingType, level: c.level, createdAt: c.createdAt,
    })),
    packs: packs.map(p => ({ id: p.id, cardId: p.cardId, createdAt: p.createdAt })),
    stats: {
      totalDepositedCents,
      yieldEarnedCents,
      apyPercent: 5,
      prosperity: totalDepositedCents / 100,
      cardCount: cards.length,
      unopenedPackCount: packs.length,
    },
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/cities/[cityId]/portfolio/route.ts" src/__tests__/api/portfolio.test.ts
git commit -m "feat: add GET /api/cities/:cityId/portfolio endpoint"
```

---

### Task 8: GET /api/referral/:cityId

**Files:**
- Create: `src/app/api/referral/[cityId]/route.ts`
- Create: `src/__tests__/api/referral.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/api/referral.test.ts
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
    createCard(db, city.id, 'flower-shop', 0)
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
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/referral.test.ts`

- [ ] **Step 3: Implement the route**

```typescript
// src/app/api/referral/[cityId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb, getCityById, getCardsByCityId, calculateYieldCents } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
  const { cityId } = await params
  const db = getDb()

  const city = getCityById(db, cityId)
  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 })
  }

  const cards = getCardsByCityId(db, cityId)
  const yieldEarnedCents = calculateYieldCents(db, cityId)

  return NextResponse.json({
    cityName: city.name,
    yieldEarned: yieldEarnedCents / 100,
    apyPercent: 5,
    cardCount: cards.length,
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/referral/[cityId]/route.ts" src/__tests__/api/referral.test.ts
git commit -m "feat: add GET /api/referral/:cityId endpoint"
```

---

## Chunk 5: Smoke Test

### Task 9: End-to-end smoke test

**Files:**
- Create: `src/__tests__/api/smoke.test.ts`

- [ ] **Step 1: Write smoke test covering the full flow**

```typescript
// src/__tests__/api/smoke.test.ts
import { describe, it, expect } from 'vitest'
import {
  getDb, createCity, createDeposit, createPack, createCard, openPack,
  deleteCard, getCardsByCityId, getUnopenedPacksByCityId,
  getTotalDepositedCents, calculateYieldCents,
} from '@/lib/db'

describe('full demo flow', () => {
  it('referral -> deposit -> open packs -> merge cards', () => {
    const db = getDb(':memory:')

    // 1. Xian creates a city
    const xian = createCity(db, "Xian's City")
    expect(xian.id).toBeDefined()

    // 2. Xian deposits $300
    const deposit = createDeposit(db, xian.id, 30000)
    const numPacks = Math.floor(30000 / 10000) // 3 packs
    expect(numPacks).toBe(3)

    // 3. Generate packs
    const packs = []
    for (let i = 0; i < numPacks; i++) {
      packs.push(createPack(db, xian.id))
    }
    expect(getUnopenedPacksByCityId(db, xian.id)).toHaveLength(3)

    // 4. Open all packs (force flower-shop for merge test)
    const cards = []
    for (const pack of packs) {
      const card = createCard(db, xian.id, 'flower-shop', 0)
      openPack(db, pack.id, card.id)
      cards.push(card)
    }
    expect(getUnopenedPacksByCityId(db, xian.id)).toHaveLength(0)
    expect(getCardsByCityId(db, xian.id)).toHaveLength(3)

    // 5. Merge two level-0 flower-shops -> level-1
    deleteCard(db, cards[0].id)
    deleteCard(db, cards[1].id)
    const merged = createCard(db, xian.id, 'flower-shop', 1)
    expect(merged.level).toBe(1)
    expect(getCardsByCityId(db, xian.id)).toHaveLength(2) // merged + remaining

    // 6. Sister gets referred
    const sister = createCity(db, "Sister's City", xian.id)
    expect(sister.referredBy).toBe(xian.id)

    // 7. Check Xian's stats for social proof
    const totalDeposited = getTotalDepositedCents(db, xian.id)
    expect(totalDeposited).toBe(30000)
    const yieldEarned = calculateYieldCents(db, xian.id)
    expect(yieldEarned).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/api/smoke.test.ts
git commit -m "test: add end-to-end smoke test for full demo flow"
```
