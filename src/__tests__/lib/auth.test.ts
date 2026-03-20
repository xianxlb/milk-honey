import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockJwtVerify = vi.fn()

vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => ({})),
  jwtVerify: mockJwtVerify,
}))

const { withAuth } = await import('@/lib/auth')

beforeEach(() => vi.clearAllMocks())

function makeReq(token?: string, walletHeader?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['authorization'] = `Bearer ${token}`
  if (walletHeader) headers['x-wallet-address'] = walletHeader
  return new Request('http://localhost/api/test', { headers })
}

describe('withAuth', () => {
  it('returns 401 when no auth provided', async () => {
    const handler = withAuth(async (_req, { walletAddress }) => Response.json({ walletAddress }) as never)
    const res = await handler(makeReq(), {})
    expect(res.status).toBe(401)
  })

  it('extracts base58 wallet address from valid JWT', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { wallets: [{ public_key: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', curve: 'ed25519' }] },
    })
    const handler = withAuth(async (_req, { walletAddress }) => Response.json({ walletAddress }) as never)
    const res = await handler(makeReq('valid-token'), {})
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.walletAddress).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
  })

  it('returns 401 when JWT has no ed25519 wallet', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { wallets: [{ public_key: '0xdeadbeef', curve: 'secp256k1' }] },
    })
    const handler = withAuth(async (_req, { walletAddress }) => Response.json({ walletAddress }) as never)
    const res = await handler(makeReq('valid-token'), {})
    expect(res.status).toBe(401)
  })

  it('returns 401 when JWT has no wallets field', async () => {
    mockJwtVerify.mockResolvedValueOnce({ payload: {} })
    const handler = withAuth(async (_req, { walletAddress }) => Response.json({ walletAddress }) as never)
    const res = await handler(makeReq('valid-token'), {})
    expect(res.status).toBe(401)
  })

  it('returns 401 when JWT verification throws', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('invalid signature'))
    const handler = withAuth(async (_req, { walletAddress }) => Response.json({ walletAddress }) as never)
    const res = await handler(makeReq('bad-token'), {})
    expect(res.status).toBe(401)
  })

  it('falls back to X-Wallet-Address header when no JWT', async () => {
    const handler = withAuth(async (_req, { walletAddress }) => Response.json({ walletAddress }) as never)
    const res = await handler(makeReq(undefined, 'fallback-wallet'), {})
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.walletAddress).toBe('fallback-wallet')
  })

  it('passes resolved params to handler', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { wallets: [{ public_key: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', curve: 'ed25519' }] },
    })
    const handler = withAuth(async (_req, { params }) => Response.json({ params }) as never)
    const res = await handler(makeReq('valid-token'), { params: { id: '42' } })
    const body = await res.json()
    expect(body.params).toEqual({ id: '42' })
  })

  it('resolves async params', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { wallets: [{ public_key: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', curve: 'ed25519' }] },
    })
    const handler = withAuth(async (_req, { params }) => Response.json({ params }) as never)
    const res = await handler(makeReq('valid-token'), { params: Promise.resolve({ id: '99' }) })
    const body = await res.json()
    expect(body.params).toEqual({ id: '99' })
  })
})
