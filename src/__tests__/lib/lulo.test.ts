import { describe, it, expect, vi, beforeEach } from 'vitest'

global.fetch = vi.fn()

const { generateDepositTx, readPosition } = await import('@/lib/lulo')

beforeEach(() => vi.clearAllMocks())

describe('generateDepositTx', () => {
  it('calls Lulo API with correct headers and returns serialized tx', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transaction: 'base64tx==' }),
    })

    const result = await generateDepositTx({ walletAddress: 'wallet123', amountUsdc: 100_000_000 })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('lulo.fi'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': expect.any(String) }),
      })
    )
    expect(result).toBe('base64tx==')
  })

  it('throws on non-ok Lulo API response', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    })

    await expect(
      generateDepositTx({ walletAddress: 'wallet123', amountUsdc: 100_000_000 })
    ).rejects.toThrow('Lulo API error 400')
  })
})

describe('readPosition', () => {
  it('returns a number (position value in USDC micro-units)', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: 105_000_000 }),
    })
    const result = await readPosition('wallet123')
    expect(typeof result).toBe('number')
  })

  it('returns 0 on API error (graceful degradation)', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 404, text: async () => '' })
    const result = await readPosition('wallet123')
    expect(result).toBe(0)
  })
})
