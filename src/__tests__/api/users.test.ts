import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ withAuth: (h: Function) => h }))

const mockUser = { wallet_address: 'wallet123', name: 'Test', created_at: new Date() }

const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
}

vi.mock('@/lib/db', () => ({ db: mockDb, users: {} }))

const { POST } = await import('@/app/api/users/me/route')

beforeEach(() => vi.clearAllMocks())

describe('POST /api/users/me', () => {
  it('upserts user and returns profile', async () => {
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    })
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUser]),
      }),
    })

    const req = new Request('http://localhost/api/users/me', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { walletAddress: 'wallet123' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.walletAddress).toBe('wallet123')
  })

  it('works when no name is provided', async () => {
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    })
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ ...mockUser, name: null }]),
      }),
    })

    const req = new Request('http://localhost/api/users/me', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { walletAddress: 'wallet123' })
    expect(res.status).toBe(200)
  })
})
