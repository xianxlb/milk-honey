import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ withAuth: (h: Function) => h }))

const makeCard = (id: string, level = 1, type = 'cow') => ({
  id, wallet_address: 'wallet123', animal_type: type, level, created_at: new Date(),
})

let selectCallCount = 0
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
}

vi.mock('@/lib/db', () => ({ db: mockDb, cards: {}, packs: {} }))

const { POST } = await import('@/app/api/cards/merge/route')

beforeEach(() => {
  vi.clearAllMocks()
  selectCallCount = 0
  mockDb.select.mockImplementation(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockImplementation(() => {
        selectCallCount++
        if (selectCallCount === 1) return Promise.resolve([makeCard('card-1')])
        return Promise.resolve([makeCard('card-2')])
      }),
    }),
  }))
  mockDb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([makeCard('card-3', 2)]) }) })
  mockDb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue([]) })
  mockDb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
})

describe('POST /api/cards/merge', () => {
  it('merges two same-type same-level cards into a level+1 card', async () => {
    const req = new Request('http://localhost/api/cards/merge', {
      method: 'POST',
      body: JSON.stringify({ cardId1: 'card-1', cardId2: 'card-2' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { walletAddress: 'wallet123' })
    expect(res.status).toBe(200)
    expect((await res.json()).card.level).toBe(2)
  })

  it('returns 400 when either card ID is missing', async () => {
    const req = new Request('http://localhost/api/cards/merge', {
      method: 'POST', body: JSON.stringify({ cardId1: 'card-1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req, { walletAddress: 'wallet123' })).status).toBe(400)
  })

  it('returns 422 when cards are different types', async () => {
    selectCallCount = 0
    mockDb.select.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          selectCallCount++
          if (selectCallCount === 1) return Promise.resolve([makeCard('card-1', 1, 'cow')])
          return Promise.resolve([makeCard('card-2', 1, 'dog')])
        }),
      }),
    }))
    const req = new Request('http://localhost/api/cards/merge', {
      method: 'POST', body: JSON.stringify({ cardId1: 'card-1', cardId2: 'card-2' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req, { walletAddress: 'wallet123' })).status).toBe(422)
  })
})
