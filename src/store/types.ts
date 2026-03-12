export type BuildingType = 'flower-shop' | 'pet-shop' | 'bookshop' | 'farm'
export type BuildingStatus = 'active' | 'wilting'
export type YieldSource = 'jupiter' | 'voltr'

export interface Building {
  id: string
  type: BuildingType
  totalValue: number
  depositValue: number
  yieldEarned: number
  uncollectedYield: number
  level: number
  pendingLevelUp: boolean
  status: BuildingStatus
  wiltingStartedAt: number | null
  yieldSource: YieldSource
  createdAt: number
}

export interface CityState {
  buildings: Building[]
  tokens: number
  lastVisitAt: number | null
  spawnTimestamps: number[]
  prosperityValue: number
}

export interface BuildingTypeConfig {
  type: BuildingType
  name: string
  emoji: string
  unlockProsperity: number
}
