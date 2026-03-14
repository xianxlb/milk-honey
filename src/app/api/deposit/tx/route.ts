import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { generateDepositTx } from '@/lib/lulo'

export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const { amountUsdc } = body

  if (typeof amountUsdc !== 'number' || amountUsdc <= 0) {
    return NextResponse.json({ error: 'amountUsdc must be a positive number' }, { status: 400 })
  }

  const transaction = await generateDepositTx({ walletAddress, amountUsdc })
  return NextResponse.json({ transaction })
})
