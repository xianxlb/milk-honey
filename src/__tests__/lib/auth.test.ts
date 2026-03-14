import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capture mock instances by reference rather than relying on mock.results index
const mockVerifyAuthToken = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@privy-io/server-auth', () => ({
  PrivyClient: vi.fn().mockImplementation(function () {
    return {
      verifyAuthToken: mockVerifyAuthToken,
      getUser: mockGetUser,
    }
  }),
}))

const { verifyPrivyJwt } = await import('@/lib/auth')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('verifyPrivyJwt', () => {
  it('returns null when no authorization header', async () => {
    const req = new Request('http://localhost/api/test')
    expect(await verifyPrivyJwt(req)).toBeNull()
  })

  it('returns null when authorization header is not Bearer', async () => {
    const req = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Basic abc' },
    })
    expect(await verifyPrivyJwt(req)).toBeNull()
  })

  it('returns null when JWT verification throws', async () => {
    mockVerifyAuthToken.mockRejectedValueOnce(new Error('invalid'))
    const req = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer bad' },
    })
    expect(await verifyPrivyJwt(req)).toBeNull()
  })

  it('returns null when user has no linked Solana wallet', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce({ userId: 'did:privy:123' })
    mockGetUser.mockResolvedValueOnce({ linkedAccounts: [] })
    const req = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer valid' },
    })
    expect(await verifyPrivyJwt(req)).toBeNull()
  })

  it('returns wallet address on valid JWT with linked Solana wallet', async () => {
    mockVerifyAuthToken.mockResolvedValueOnce({ userId: 'did:privy:123' })
    mockGetUser.mockResolvedValueOnce({
      linkedAccounts: [
        { type: 'wallet', chainType: 'solana', address: 'SoLWaLLet1234' },
      ],
    })
    const req = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer valid' },
    })
    expect(await verifyPrivyJwt(req)).toBe('SoLWaLLet1234')
  })
})
