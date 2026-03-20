import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import nacl from 'tweetnacl'
import bs58 from 'bs58'

const secret = new TextEncoder().encode(
  process.env.SESSION_JWT_SECRET ?? 'dev-secret-change-in-production'
)

export async function POST(req: Request) {
  const { message, signature, walletAddress } = await req.json()
  if (!message || !signature || !walletAddress) {
    return NextResponse.json({ error: 'message, signature, and walletAddress required' }, { status: 400 })
  }

  // Verify the message was issued recently (within 5 minutes)
  const issuedAtMatch = message.match(/Issued At: (.+)/)
  if (!issuedAtMatch) return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
  const issuedAt = new Date(issuedAtMatch[1]).getTime()
  if (Date.now() - issuedAt > 5 * 60 * 1000) {
    return NextResponse.json({ error: 'Message expired' }, { status: 400 })
  }

  // Verify ed25519 signature
  try {
    const msgBytes = new TextEncoder().encode(message)
    const sigBytes = bs58.decode(signature)
    const pubKeyBytes = bs58.decode(walletAddress)
    const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes)
    if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const sessionToken = await new SignJWT({ walletAddress })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(walletAddress)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  return NextResponse.json({ sessionToken })
}
