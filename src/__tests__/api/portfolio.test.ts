import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ withAuth: (h: Function) => h }))
vi.mock('@/lib/lulo', () => ({
  readPosition: vi.fn().mockResolvedValue(105_000_000),
  readApy: vi.fn().mockResolvedValue(5.5),
}))

const mockDb = {
  select: vi.fn(),
}
vi.mock('@/lib/db', () => ({ db: mockDb, users: {}, cards: {}, packs: {}, deposits: {} }))

const { GET } = await import('@/app/api/portfolio/route')

// Build a mock query chain that supports both:
//   .where() → Promise (plain queries)
//   .where().orderBy().limit() → Promise (latest deposit query)
function makeChain(result: unknown[] = []) {
  const whereResult = {
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(result),
    }),
    then: (resolve: (v: unknown[]) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
    catch: (reject: (e: unknown) => unknown) => Promise.resolve(result).catch(reject),
  }
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(whereResult),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.select.mockImplementation(() => makeChain([]))
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
    expect(body.stats.apyPercent).toBe(5.5)
  })

  it('calculates yield as position minus total deposited', async () => {
    // Mock: cards (empty), packs (empty), deposits sum (100 USDC), latestDeposit (empty)
    mockDb.select
      .mockImplementationOnce(() => makeChain([]))                          // cards
      .mockImplementationOnce(() => makeChain([]))                          // packs
      .mockImplementationOnce(() => makeChain([{ total: '100000000' }]))    // deposits sum
      // latestDeposit falls through to beforeEach default (empty)

    const req = new Request('http://localhost/api/portfolio')
    const res = await GET(req, { walletAddress: 'wallet123' })
    const body = await res.json()
    // position = 105_000_000, deposited = 100_000_000 → yield = 5_000_000
    expect(body.stats.yieldEarnedUsdc).toBe(5_000_000)
  })
})
