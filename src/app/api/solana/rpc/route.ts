import { NextRequest, NextResponse } from 'next/server'

const HELIUS_RPC_URL = process.env.SOLANA_RPC_URL!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const res = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
