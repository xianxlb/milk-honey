import { createRemoteJWKSet, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import bs58 from 'bs58'

const WEB3AUTH_JWKS = createRemoteJWKSet(
  new URL('https://api-auth.web3auth.io/jwks')
)

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_JWT_SECRET ?? 'dev-secret-change-in-production'
)

// Verify a Web3Auth idToken and extract the Solana wallet address
async function verifyWeb3AuthJwt(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, WEB3AUTH_JWKS, {
      algorithms: ['ES256'],
    })
    const wallets = payload['wallets'] as Array<{ public_key: string; curve: string }> | undefined
    const solWallet = wallets?.find(w => w.curve === 'ed25519')
    if (!solWallet) return null
    const key = solWallet.public_key
    // Key may be base58 (already a Solana address) or hex
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key)) return key
    // Try hex → bytes → base58
    const bytes = Buffer.from(key.replace(/^0x/, ''), 'hex')
    if (bytes.length === 32) return bs58.encode(bytes)
    return null
  } catch {
    return null
  }
}

// Verify a WalletConnect session JWT issued by /api/auth/verify
async function verifySessionJwt(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET, { algorithms: ['HS256'] })
    return (payload.walletAddress as string) ?? null
  } catch {
    return null
  }
}

type AuthedHandler = (
  req: Request,
  ctx: { walletAddress: string; params?: Record<string, string> }
) => Promise<NextResponse>

export function withAuth(handler: AuthedHandler) {
  return async (
    req: Request,
    { params }: { params?: Promise<Record<string, string>> | Record<string, string> }
  ) => {
    const auth = req.headers.get('authorization')
    let walletAddress: string | null = null

    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice(7)
      walletAddress = await verifyWeb3AuthJwt(token) ?? await verifySessionJwt(token)
    }

    // Fallback: X-Wallet-Address header (used with WalletConnect session tokens)
    if (!walletAddress) {
      walletAddress = req.headers.get('x-wallet-address')
    }

    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    return handler(req, { walletAddress, params: resolvedParams })
  }
}
