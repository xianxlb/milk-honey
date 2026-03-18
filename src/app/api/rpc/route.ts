export async function POST(req: Request) {
  const rpcUrl = process.env.SOLANA_RPC_URL
  if (!rpcUrl) {
    return new Response('RPC not configured', { status: 500 })
  }

  const body = await req.text()
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  const data = await response.text()
  return new Response(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
