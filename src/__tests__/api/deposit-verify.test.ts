import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ withAuth: (h: Function) => h }))
const mockVerifyTx = vi.fn()
vi.mock('@/lib/solana', () => ({ verifyTx: mockVerifyTx }))

// Stateful mock db — controls select return per test
let mockExistingDeposit: unknown[] = []
const mockDb = {
  select: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(mockExistingDeposit),
    }),
  })),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      returning: vi.fn().mockResolvedValue([{
        id: 'dep-1', wallet_address: 'wallet123', tx_signature: 'sig1',
        amount_usdc: 300_000_000, created_at: new Date(),
      }]),
    }),
  }),
}
vi.mock('@/lib/db', () => ({ db: mockDb, deposits: {}, packs: {}, users: {} }))

const { POST } = await import('@/app/api/deposit/verify/route')

beforeEach(() => {
  vi.clearAllMocks()
  mockExistingDeposit = []
  // Re-apply stateful mock after clearAllMocks
  mockDb.select.mockImplementation(() => ({
    from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(mockExistingDeposit) }),
  }))
  mockDb.insert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      returning: vi.fn().mockResolvedValue([{
        id: 'dep-1', wallet_address: 'wallet123', tx_signature: 'sig1',
        amount_usdc: 300_000_000, created_at: new Date(),
      }]),
    }),
  })
})

describe('POST /api/deposit/verify', () => {
  it('returns 400 when txSignature is missing', async () => {
    const req = new Request('http://localhost/api/deposit/verify', {
      method: 'POST', body: JSON.stringify({ amountUsdc: 100_000_000 }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req, { walletAddress: 'wallet123' })).status).toBe(400)
  })

  it('returns 400 when amountUsdc is missing', async () => {
    const req = new Request('http://localhost/api/deposit/verify', {
      method: 'POST', body: JSON.stringify({ txSignature: 'sig' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req, { walletAddress: 'wallet123' })).status).toBe(400)
  })

  it('returns 400 when tx is not confirmed on-chain', async () => {
    mockVerifyTx.mockResolvedValueOnce(false)
    const req = new Request('http://localhost/api/deposit/verify', {
      method: 'POST', body: JSON.stringify({ txSignature: 'bad-sig', amountUsdc: 100_000_000 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { walletAddress: 'wallet123' })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/not confirmed/i)
  })

  it('returns 409 when tx signature already used', async () => {
    mockVerifyTx.mockResolvedValueOnce(true)
    mockExistingDeposit = [{ id: 'existing' }]
    const req = new Request('http://localhost/api/deposit/verify', {
      method: 'POST', body: JSON.stringify({ txSignature: 'dup-sig', amountUsdc: 100_000_000 }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req, { walletAddress: 'wallet123' })).status).toBe(409)
  })

  it('credits 3 packs for 300 USDC deposit', async () => {
    mockVerifyTx.mockResolvedValueOnce(true)
    const req = new Request('http://localhost/api/deposit/verify', {
      method: 'POST', body: JSON.stringify({ txSignature: 'sig1', amountUsdc: 300_000_000 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { walletAddress: 'wallet123' })
    expect(res.status).toBe(200)
    expect((await res.json()).packs).toHaveLength(3)
  })
})
