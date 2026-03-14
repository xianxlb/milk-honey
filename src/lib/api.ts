const CITY_ID_KEY = 'milk_honey_city_id'

export function getCityId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CITY_ID_KEY)
}

export function setCityId(id: string): void {
  localStorage.setItem(CITY_ID_KEY, id)
}

export function clearCityId(): void {
  localStorage.removeItem(CITY_ID_KEY)
}

// --- Types ---

export interface Card {
  id: string
  buildingType: string
  level: number
  createdAt: number
}

export interface Pack {
  id: string
  cardId: string | null
  createdAt: number
}

export interface PortfolioStats {
  totalDepositedCents: number
  yieldEarnedCents: number
  apyPercent: number
  prosperity: number
  cardCount: number
  unopenedPackCount: number
}

export interface Portfolio {
  city: { id: string; name: string; createdAt: number }
  cards: Card[]
  packs: Pack[]
  stats: PortfolioStats
}

export interface DepositResult {
  deposit: { id: string; amount: number; createdAt: number }
  packs: Pack[]
}

export interface PackOpenResult {
  pack: { id: string; cardId: string; openedAt: number }
  card: Card
}

export interface MergeResult {
  card: Card
}

// --- API calls ---

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `API error ${res.status}`)
  }
  return data as T
}

export async function createCity(name: string, referralCode?: string, walletAddress?: string): Promise<{ id: string; name: string; walletAddress?: string; referralCode: string; createdAt: number }> {
  const body: Record<string, string> = { name }
  if (referralCode) body.referralCode = referralCode
  if (walletAddress) body.walletAddress = walletAddress
  return apiFetch('/api/cities', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function ensureCity(walletAddress?: string): Promise<string> {
  // If no wallet, fall back to localStorage-based city
  if (!walletAddress) {
    const cityId = getCityId()
    if (cityId) return cityId

    const city = await createCity('My City')
    setCityId(city.id)
    return city.id
  }

  // Wallet-based: always pass wallet to backend (returns existing or creates new)
  const city = await createCity('My City', undefined, walletAddress)
  setCityId(city.id)
  return city.id
}

export async function getPortfolio(cityId: string): Promise<Portfolio> {
  return apiFetch(`/api/cities/${cityId}/portfolio`)
}

export async function deposit(cityId: string, amountDollars: number, txSignature?: string): Promise<DepositResult> {
  return apiFetch('/api/deposit', {
    method: 'POST',
    body: JSON.stringify({ cityId, amount: amountDollars, txSignature }),
  })
}

export async function openPack(packId: string): Promise<PackOpenResult> {
  return apiFetch(`/api/packs/${packId}/open`, {
    method: 'POST',
  })
}

export async function mergeCards(cardId1: string, cardId2: string): Promise<MergeResult> {
  return apiFetch('/api/cards/merge', {
    method: 'POST',
    body: JSON.stringify({ cardId1, cardId2 }),
  })
}
