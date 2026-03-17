import { AnimalType } from '@/lib/animals'

export type { AnimalType }
export type AnimalStatus = 'active' | 'wilting'
export type YieldSource = 'jupiter' | 'voltr'

export interface Animal {
  id: string
  type: AnimalType
  totalValue: number
  depositValue: number
  yieldEarned: number
  uncollectedYield: number
  level: number
  pendingLevelUp: boolean
  status: AnimalStatus
  wiltingStartedAt: number | null
  yieldSource: YieldSource
  createdAt: number
}

export interface CrewState {
  animals: Animal[]
  tokens: number
  lastVisitAt: number | null
  spawnTimestamps: number[]
  prosperityValue: number
}

export interface AnimalTypeConfig {
  type: AnimalType
  name: string
  emoji: string
  unlockProsperity: number
}
