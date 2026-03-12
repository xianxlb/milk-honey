import { Building, BuildingTypeConfig } from '@/store/types'
import { LEVEL_THRESHOLDS, MAX_LEVEL, MIN_DEPOSIT, MAX_BUILDINGS, MAX_SPAWNS_PER_DAY, SPAWN_WINDOW_MS, TOKENS_PER_DOLLAR, BUILDING_TYPES } from './constants'

export function calculateLevel(totalValue: number): number {
  if (totalValue < LEVEL_THRESHOLDS[0]) return 0
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalValue >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 0
}

export function canSpawnBuilding(buildings: Building[], spawnTimestamps: number[], now: number): boolean {
  if (buildings.length >= MAX_BUILDINGS) return false
  const recentSpawns = spawnTimestamps.filter(t => now - t < SPAWN_WINDOW_MS)
  return recentSpawns.length < MAX_SPAWNS_PER_DAY
}

export function canMergeBuildings(a: Building, b: Building): boolean {
  if (a.id === b.id) return false
  if (a.type !== b.type) return false
  if (a.level !== b.level) return false
  if (a.level >= MAX_LEVEL) return false
  return true
}

export function calculateProsperity(buildings: Building[]): number {
  return buildings.reduce((sum, b) => sum + b.totalValue, 0)
}

export function calculateTokensFromYield(yieldAmount: number): number {
  return Math.floor(yieldAmount * TOKENS_PER_DOLLAR)
}

export function getAvailableBuildingTypes(prosperity: number): BuildingTypeConfig[] {
  return BUILDING_TYPES.filter(b => prosperity >= b.unlockProsperity)
}

export function validateDeposit(amount: number, action: 'spawn' | 'upgrade'): { valid: boolean; error?: string } {
  if (amount <= 0) return { valid: false, error: 'Deposit must be greater than zero' }
  if (action === 'spawn' && amount < MIN_DEPOSIT) {
    return { valid: false, error: `Minimum $${MIN_DEPOSIT} deposit required for new buildings` }
  }
  return { valid: true }
}
