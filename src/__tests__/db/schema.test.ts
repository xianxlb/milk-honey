import { describe, it, expect } from 'vitest'
import { users, deposits, packs, cards } from '@/lib/db/schema'
import { getTableColumns } from 'drizzle-orm'

describe('schema columns', () => {
  it('users has wallet_address, name, created_at', () => {
    const cols = Object.keys(getTableColumns(users))
    expect(cols).toContain('wallet_address')
    expect(cols).toContain('name')
    expect(cols).toContain('created_at')
  })

  it('deposits has tx_signature (unique) and amount_usdc', () => {
    const cols = Object.keys(getTableColumns(deposits))
    expect(cols).toContain('tx_signature')
    expect(cols).toContain('amount_usdc')
    expect(cols).toContain('wallet_address')
  })

  it('packs has deposit_id and card_id', () => {
    const cols = Object.keys(getTableColumns(packs))
    expect(cols).toContain('deposit_id')
    expect(cols).toContain('card_id')
  })

  it('cards has building_type and level defaulting to 1', () => {
    const cols = getTableColumns(cards)
    expect(cols).toHaveProperty('building_type')
    expect(cols).toHaveProperty('level')
    // Verify default value is 1 (not 0)
    expect((cols.level as { default?: unknown }).default).toBe(1)
  })
})
