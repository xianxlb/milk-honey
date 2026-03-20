// Typed client-side fetch helpers — one function per API route

let _walletAddress: string | undefined

export function setApiWalletAddress(addr: string | undefined) {
  _walletAddress = addr
}

async function apiFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(_walletAddress ? { 'X-Wallet-Address': _walletAddress } : {}),
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

export async function getPendingWithdrawal(token: string) {
  return apiFetch('/api/withdraw/pending', token)
}

export async function getWithdrawTx(token: string, type: 'initiate', amountUsdc: number): Promise<{ transaction: string }>
export async function getWithdrawTx(token: string, type: 'complete'): Promise<{ transaction: string }>
export async function getWithdrawTx(token: string, type: string, amountUsdc?: number) {
  return apiFetch('/api/withdraw/tx', token, {
    method: 'POST',
    body: JSON.stringify(type === 'initiate' ? { type, amountUsdc } : { type }),
  })
}

export async function recordWithdrawInitiate(token: string, txSignature: string, amountUsdc: number) {
  return apiFetch('/api/withdraw/initiate', token, {
    method: 'POST',
    body: JSON.stringify({ txSignature, amountUsdc }),
  })
}

export async function recordWithdrawComplete(token: string, txSignature: string) {
  return apiFetch('/api/withdraw/complete', token, {
    method: 'POST',
    body: JSON.stringify({ txSignature }),
  })
}

export async function getReferralMe(token: string) {
  return apiFetch('/api/referral/me', token)
}
