import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wallet = searchParams.get('wallet')
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 })

  const nonce = randomBytes(16).toString('hex')
  const issuedAt = new Date().toISOString()
  const message = [
    `milk-honey.app wants you to sign in with your Solana account:`,
    wallet,
    ``,
    `Sign in to Milk & Honey`,
    ``,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')

  return NextResponse.json({ message })
}
