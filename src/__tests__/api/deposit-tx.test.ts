import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ withAuth: (h: Function) => h }))
const mockGenerateDepositTx = vi.fn()
vi.mock('@/lib/lulo', () => ({ generateDepositTx: mockGenerateDepositTx }))

const { POST } = await import('@/app/api/deposit/tx/route')

beforeEach(() => vi.clearAllMocks())

describe('POST /api/deposit/tx', () => {
  it('returns serialized transaction for valid amountUsdc', async () => {
    mockGenerateDepositTx.mockResolvedValueOnce('base64tx==')
    const req = new Request('http://localhost/api/deposit/tx', {
      method: 'POST',
      body: JSON.stringify({ amountUsdc: 100_000_000 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { walletAddress: 'wallet123' })
    expect(res.status).toBe(200)
    expect((await res.json()).transaction).toBe('base64tx==')
  })

  it('returns 400 when amountUsdc is missing', async () => {
    const req = new Request('http://localhost/api/deposit/tx', {
      method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { walletAddress: 'wallet123' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when amountUsdc is not a positive number', async () => {
    const req = new Request('http://localhost/api/deposit/tx', {
      method: 'POST', body: JSON.stringify({ amountUsdc: -1 }), headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { walletAddress: 'wallet123' })
    expect(res.status).toBe(400)
  })
})
