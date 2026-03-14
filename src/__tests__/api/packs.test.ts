import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ withAuth: (h: Function) => h }))

const mockPack = { id: 'pack-1', wallet_address: 'wallet123', deposit_id: 'dep-1', card_id: null, opened_at: null, created_at: new Date() }
const mockCard = { id: 'card-1', wallet_address: 'wallet123', building_type: 'bakery', level: 1, created_at: new Date() }

const mockDb = { select: vi.fn(), insert: vi.fn(), update: vi.fn() }
vi.mock('@/lib/db', () => ({ db: mockDb, packs: {}, cards: {} }))

const { POST } = await import('@/app/api/packs/[id]/open/route')

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([mockPack]) }) })
  mockDb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([mockCard]) }) })
  mockDb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
})

describe('POST /api/packs/[id]/open', () => {
  it('reveals a building card at level 1 and marks pack as opened', async () => {
    const req = new Request('http://localhost/api/packs/pack-1/open', { method: 'POST' })
    const res = await POST(req, { walletAddress: 'wallet123', params: { id: 'pack-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.card).toBeDefined()
    expect(body.card.level).toBe(1)
  })

  it('returns 404 when pack is not found for this wallet', async () => {
    mockDb.select.mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
    const req = new Request('http://localhost/api/packs/bad-id/open', { method: 'POST' })
    const res = await POST(req, { walletAddress: 'wallet123', params: { id: 'bad-id' } })
    expect(res.status).toBe(404)
  })

  it('returns 400 when pack ID param is missing', async () => {
    const req = new Request('http://localhost/api/packs/open', { method: 'POST' })
    const res = await POST(req, { walletAddress: 'wallet123', params: {} })
    expect(res.status).toBe(400)
  })
})
