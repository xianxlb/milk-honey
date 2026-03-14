import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/lulo', () => ({ readPosition: vi.fn().mockResolvedValue(110_000_000) }))

const mockDb = { select: vi.fn() }
vi.mock('@/lib/db', () => ({ db: mockDb, users: {}, deposits: {}, cards: {} }))

const { GET } = await import('@/app/api/referral/[wallet]/route')

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.select
    .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ wallet_address: 'wallet123', name: 'Alice' }]) }) }) // user
    .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ total: '100000000' }]) }) }) // deposits sum
    .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{}, {}]) }) }) // cards (2)
})

describe('GET /api/referral/[wallet]', () => {
  it('returns social proof data for a known wallet', async () => {
    const req = new Request('http://localhost/api/referral/wallet123')
    const res = await GET(req, { params: Promise.resolve({ wallet: 'wallet123' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cityName).toBe('Alice')
    expect(body.yieldEarnedUsdc).toBe(10_000_000) // 110M - 100M
    expect(body.cardCount).toBe(2)
    expect(body.apyPercent).toBe(5)
  })

  it('returns 404 for unknown wallet', async () => {
    mockDb.select.mockReset()
    mockDb.select.mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
    const req = new Request('http://localhost/api/referral/unknown')
    const res = await GET(req, { params: Promise.resolve({ wallet: 'unknown' }) })
    expect(res.status).toBe(404)
  })
})
