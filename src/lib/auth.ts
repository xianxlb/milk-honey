import { PrivyClient } from '@privy-io/server-auth'
import { NextResponse } from 'next/server'

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
)

export async function verifyPrivyJwt(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const claims = await privy.verifyAuthToken(auth.slice(7))
    const user = await privy.getUser(claims.userId)
    const solanaAccount = user.linkedAccounts.find(
      (a) => a.type === 'wallet' && (a as { chainType?: string }).chainType === 'solana'
    ) as { address: string } | undefined
    return solanaAccount?.address ?? null
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
    const walletAddress = await verifyPrivyJwt(req)
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const resolvedParams = params instanceof Promise ? await params : params
    return handler(req, { walletAddress, params: resolvedParams })
  }
}
