import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ withAuth: (h: Function) => h }))
vi.mock('@/lib/lulo', () => ({ readPosition: vi.fn().mockResolvedValue(105_000_000) }))

const mockDb = {
  select: vi.fn(),
}
vi.mock('@/lib/db', () => ({ db: mockDb, users: {}, cards: {}, packs: {}, deposits: {} }))

const { GET } = await import('@/app/api/portfolio/route')

beforeEach(() => {
  vi.clearAllMocks()
  // Default: empty tables
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  })
})

describe('GET /api/portfolio', () => {
  it('returns portfolio structure with correct shape', async () => {
    const req = new Request('http://localhost/api/portfolio')
    const res = await GET(req, { walletAddress: 'wallet123' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('cards')
    expect(body).toHaveProperty('packs')
    expect(body).toHaveProperty('stats')
    expect(body.stats.apyPercent).toBe(5)
  })

  it('calculates yield as position minus total deposited', async () => {
    // Mock: cards (empty), packs (empty), deposits sum (100 USDC)
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }), // cards
    }).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }), // packs
    }).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ total: '100000000' }]) }), // deposits sum
    })

    const req = new Request('http://localhost/api/portfolio')
    const res = await GET(req, { walletAddress: 'wallet123' })
    const body = await res.json()
    // position = 105_000_000, deposited = 100_000_000 → yield = 5_000_000
    expect(body.stats.yieldEarnedUsdc).toBe(5_000_000)
  })
})
