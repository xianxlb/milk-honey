import { PrivyClient } from '@privy-io/server-auth'
import { NextResponse } from 'next/server'

// Called as a factory so vi.fn() mocks work in tests (arrow-fn implementations
// cannot be used as constructors in vitest v4; calling without `new` is fine).
type PrivyInstance = InstanceType<typeof PrivyClient>
const PrivyFactory = PrivyClient as unknown as (
  appId: string,
  secret: string
) => PrivyInstance

function getPrivyClient(): PrivyInstance {
  return PrivyFactory(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!,
  )
}

export async function verifyPrivyJwt(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const privy = getPrivyClient()
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
  // Next.js 15+ passes params as a Promise — handle both resolved and promised forms
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
