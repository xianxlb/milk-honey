import { BuildingTypeConfig } from '@/store/types'

export const LEVEL_THRESHOLDS = [100, 200, 400, 800, 1600, 3200, 6400, 12800] as const
export const MAX_LEVEL = 8
export const MIN_DEPOSIT = 1
export const MAX_BUILDINGS = 20
export const MAX_SPAWNS_PER_DAY = 2
export const SPAWN_WINDOW_MS = 24 * 60 * 60 * 1000
export const WILT_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000
export const TOKENS_PER_DOLLAR = 10

export const BUILDING_TYPES: BuildingTypeConfig[] = [
  { type: 'bakery', name: 'Bakery', emoji: '🧁', unlockProsperity: 0 },
  { type: 'bookshop', name: 'Bookshop', emoji: '📚', unlockProsperity: 0 },
  { type: 'cafe', name: 'Café', emoji: '☕', unlockProsperity: 0 },
  { type: 'house', name: 'House', emoji: '🏠', unlockProsperity: 0 },
  { type: 'pet-shop', name: 'Pet Shop', emoji: '🐱', unlockProsperity: 0 },
]

export const STARTER_BUILDING_TYPES = BUILDING_TYPES.filter(b => b.unlockProsperity === 0)

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
