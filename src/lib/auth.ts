import { PrivyClient } from '@privy-io/server-auth'
import { NextResponse } from 'next/server'

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
)

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
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await privy.verifyAuthToken(auth.slice(7))
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const walletAddress = req.headers.get('x-wallet-address')
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    return handler(req, { walletAddress, params: resolvedParams })
  }
}
