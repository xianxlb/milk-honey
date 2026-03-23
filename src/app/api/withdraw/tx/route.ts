import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { generateWithdrawInitiateTx, generateWithdrawCompleteTx } from '@/lib/lulo'

// Generates a Lulo withdrawal transaction without writing to the DB.
// The client signs + sends the returned transaction, then calls the
// appropriate record-keeping route (/api/withdraw/initiate or /api/withdraw/complete).
//
// Body: { type: 'initiate', amountUsdc: number } | { type: 'complete' }
export const POST = withAuth(async (req, { walletAddress }) => {
  const body = await req.json().catch(() => ({}))
  const { type, amountUsdc } = body

  if (type === 'initiate') {
    if (typeof amountUsdc !== 'number' || amountUsdc <= 0) {
      return NextResponse.json({ error: 'amountUsdc must be a positive number' }, { status: 400 })
    }
    const transaction = await generateWithdrawInitiateTx({ walletAddress, amountUsdc })
    return NextResponse.json({ transaction })
  }

  if (type === 'complete') {
    const transaction = await generateWithdrawCompleteTx({ walletAddress })
    return NextResponse.json({ transaction })
  }

  return NextResponse.json({ error: 'type must be "initiate" or "complete"' }, { status: 400 })
})
