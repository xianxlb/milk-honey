import { pgTable, text, bigint, integer, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  wallet_address: text('wallet_address').primaryKey(),
  name: text('name'),
  farm_code: text('farm_code').unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const deposits = pgTable('deposits', {
  id: uuid('id').primaryKey().defaultRandom(),
  wallet_address: text('wallet_address').notNull().references(() => users.wallet_address),
  tx_signature: text('tx_signature').notNull().unique(),
  amount_usdc: bigint('amount_usdc', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  wallet_address: text('wallet_address').notNull().references(() => users.wallet_address),
  animal_type: text('animal_type').notNull(),
  level: integer('level').notNull().default(1),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// Pending deposits awaiting Helius webhook confirmation
export const pendingDeposits = pgTable('pending_deposits', {
  id: uuid('id').primaryKey().defaultRandom(),
  wallet_address: text('wallet_address').notNull(),
  tx_signature: text('tx_signature').notNull().unique(),
  amount_usdc: bigint('amount_usdc', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// cards must be defined before packs (FK reference)
export const packs = pgTable('packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  wallet_address: text('wallet_address').notNull().references(() => users.wallet_address),
  deposit_id: uuid('deposit_id').notNull().references(() => deposits.id),
  card_id: uuid('card_id').references(() => cards.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  opened_at: timestamp('opened_at'),
})

export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').primaryKey().defaultRandom(),
  wallet_address: text('wallet_address').notNull().references(() => users.wallet_address),
  amount_usdc: bigint('amount_usdc', { mode: 'number' }).notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'completed'
  cooldown_seconds: integer('cooldown_seconds').notNull().default(0),
  initiated_tx: text('initiated_tx').notNull(),
  completed_tx: text('completed_tx'),
  initiated_at: timestamp('initiated_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'),
})
