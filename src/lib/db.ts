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
  db.prepare('UPDATE packs SET card_id = NULL WHERE card_id = ?').run(id)
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
