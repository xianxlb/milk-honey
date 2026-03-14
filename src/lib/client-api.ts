// Typed client-side fetch helpers — one function per API route

async function apiFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.error ?? `API ${res.status}`), { status: res.status })
  }
  return res.json()
}

export async function ensureUser(token: string, name?: string) {
  return apiFetch('/api/users/me', token, { method: 'POST', body: JSON.stringify({ name }) })
}

export async function getPortfolio(token: string) {
  return apiFetch('/api/portfolio', token)
}

export async function getDepositTx(token: string, amountUsdc: number) {
  return apiFetch('/api/deposit/tx', token, { method: 'POST', body: JSON.stringify({ amountUsdc }) })
}

export async function verifyDeposit(token: string, txSignature: string, amountUsdc: number) {
  return apiFetch('/api/deposit/verify', token, {
    method: 'POST',
    body: JSON.stringify({ txSignature, amountUsdc }),
  })
}

export async function openPack(token: string, packId: string) {
  return apiFetch(`/api/packs/${packId}/open`, token, { method: 'POST' })
}

export async function mergeCards(token: string, cardId1: string, cardId2: string) {
  return apiFetch('/api/cards/merge', token, {
    method: 'POST',
    body: JSON.stringify({ cardId1, cardId2 }),
  })
}
