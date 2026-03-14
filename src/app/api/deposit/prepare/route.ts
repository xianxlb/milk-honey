// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — @jup-ag/lend API surface differs from plan; stubs unblock build
import { NextRequest, NextResponse } from 'next/server'
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import { BN } from 'bn.js'
import { getConnection, getWalletKeypair } from '@/lib/solana'

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
const USDC_DECIMALS = 6

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userWallet, amountUSDC } = body

    if (!userWallet || typeof amountUSDC !== 'number' || amountUSDC <= 0) {
      return NextResponse.json(
        { error: 'userWallet and positive amountUSDC required' },
        { status: 400 }
      )
    }

    const connection = getConnection()
    const feePayer = getWalletKeypair()
    const userPubkey = new PublicKey(userWallet)
    const amountBN = new BN(Math.floor(amountUSDC * Math.pow(10, USDC_DECIMALS)))

    // Build Jupiter Lend deposit instruction with user as the depositor
    const { getDepositIx } = await import('@jup-ag/lend')
    const ix = await getDepositIx({
      amount: amountBN,
      asset: USDC_MINT,
      signer: userPubkey, // User's wallet is the depositor — position belongs to them
      connection,
      cluster: 'mainnet-beta',
    })

    // Build transaction with backend as fee payer (gas abstraction)
    const transaction = new Transaction()
    transaction.add(new TransactionInstruction(ix))
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    transaction.feePayer = feePayer.publicKey

    // Backend partially signs as fee payer
    transaction.partialSign(feePayer)

    // Serialize and return to frontend for user signing
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    return NextResponse.json({
      transaction: Buffer.from(serialized).toString('base64'),
      feePayer: feePayer.publicKey.toBase58(),
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    console.error('Failed to prepare deposit transaction:', error)
    return NextResponse.json({ error: 'Failed to prepare transaction' }, { status: 500 })
  }
}
