import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Building, BuildingType, CityState, YieldSource } from './types'
import { calculateLevel, calculateProsperity, calculateTokensFromYield } from '@/lib/game-logic'
import { MIN_DEPOSIT, WILT_GRACE_PERIOD_MS } from '@/lib/constants'

interface CityActions {
  spawnBuilding: (type: BuildingType, amount: number, yieldSource: YieldSource) => void
  upgradeBuilding: (id: string, amount: number) => void
  mergeBuildings: (idA: string, idB: string) => void
  withdrawFull: (id: string) => void
  withdrawPartial: (id: string, amount: number) => void
  collectRent: (id: string) => void
  updateBuildingYield: (id: string, amount: number) => void
  confirmLevelUp: (id: string) => void
  removeExpiredBuildings: () => void
  setLastVisit: (timestamp: number) => void
}

type CityStore = CityState & CityActions

export const useCityStore = create<CityStore>()(
  persist(
    (set, get) => ({
      buildings: [],
      tokens: 0,
      lastVisitAt: null,
      spawnTimestamps: [],
      prosperityValue: 0,

      spawnBuilding: (type, amount, yieldSource) => {
        const now = Date.now()
        const newBuilding: Building = {
          id: `building-${now}-${Math.random().toString(36).slice(2, 9)}`,
          type,
          totalValue: amount,
          depositValue: amount,
          yieldEarned: 0,
          uncollectedYield: 0,
          level: calculateLevel(amount),
          pendingLevelUp: false,
          status: 'active',
          wiltingStartedAt: null,
          yieldSource,
          createdAt: now,
        }
        set(state => {
          const buildings = [...state.buildings, newBuilding]
          return {
            buildings,
            spawnTimestamps: [...state.spawnTimestamps, now],
            prosperityValue: calculateProsperity(buildings),
          }
        })
      },

      upgradeBuilding: (id, amount) => {
        set(state => {
          const buildings = state.buildings.map(b => {
            if (b.id !== id) return b
            const totalValue = b.totalValue + amount
            const depositValue = b.depositValue + amount
            const level = calculateLevel(totalValue)
            const updated: Building = {
              ...b,
              totalValue,
              depositValue,
              level,
              // Cancel wilting if deposit brings value above minimum
              status: totalValue >= MIN_DEPOSIT ? 'active' : b.status,
              wiltingStartedAt: totalValue >= MIN_DEPOSIT ? null : b.wiltingStartedAt,
            }
            return updated
          })
          return { buildings, prosperityValue: calculateProsperity(buildings) }
        })
      },

      mergeBuildings: (idA, idB) => {
        const state = get()
        const a = state.buildings.find(b => b.id === idA)
        const b = state.buildings.find(b => b.id === idB)
        if (!a || !b) return

        const now = Date.now()
        const mergedValue = a.totalValue + b.totalValue
        const merged: Building = {
          id: `building-${now}-${Math.random().toString(36).slice(2, 9)}`,
          type: a.type,
          totalValue: mergedValue,
          depositValue: a.depositValue + b.depositValue,
          yieldEarned: a.yieldEarned + b.yieldEarned,
          uncollectedYield: a.uncollectedYield + b.uncollectedYield,
          level: a.level + 1,
          pendingLevelUp: false,
          status: 'active',
          wiltingStartedAt: null,
          yieldSource: a.yieldSource,
          createdAt: now,
        }

        set(state => {
          const buildings = [
            ...state.buildings.filter(b => b.id !== idA && b.id !== idB),
            merged,
          ]
          return { buildings, prosperityValue: calculateProsperity(buildings) }
        })
      },

      withdrawFull: (id) => {
        set(state => ({
          buildings: state.buildings.map(b =>
            b.id === id
              ? { ...b, status: 'wilting', wiltingStartedAt: Date.now() }
              : b
          ),
        }))
      },

      withdrawPartial: (id, amount) => {
        set(state => {
          const buildings = state.buildings.map(b => {
            if (b.id !== id) return b
            const totalValue = b.totalValue - amount
            const depositValue = Math.max(0, b.depositValue - amount)
            const level = calculateLevel(totalValue)
            const wilting = totalValue < MIN_DEPOSIT
            return {
              ...b,
              totalValue,
              depositValue,
              level,
              status: wilting ? 'wilting' as const : 'active' as const,
              wiltingStartedAt: wilting && !b.wiltingStartedAt ? Date.now() : b.wiltingStartedAt,
            }
          })
          return { buildings, prosperityValue: calculateProsperity(buildings) }
        })
      },

      collectRent: (id) => {
        set(state => {
          let tokensEarned = 0
          const buildings = state.buildings.map(b => {
            if (b.id !== id) return b
            tokensEarned = calculateTokensFromYield(b.uncollectedYield)
            return { ...b, uncollectedYield: 0 }
          })
          return { buildings, tokens: state.tokens + tokensEarned }
        })
      },

      updateBuildingYield: (id, amount) => {
        set(state => {
          const buildings = state.buildings.map(b => {
            if (b.id !== id) return b
            const totalValue = b.totalValue + amount
            const yieldEarned = b.yieldEarned + amount
            const uncollectedYield = b.uncollectedYield + amount
            const newLevel = calculateLevel(totalValue)
            const pendingLevelUp = newLevel > b.level
            return { ...b, totalValue, yieldEarned, uncollectedYield, pendingLevelUp }
          })
          return { buildings, prosperityValue: calculateProsperity(buildings) }
        })
      },

      confirmLevelUp: (id) => {
        set(state => ({
          buildings: state.buildings.map(b => {
            if (b.id !== id) return b
            return { ...b, level: calculateLevel(b.totalValue), pendingLevelUp: false }
          }),
        }))
      },

      removeExpiredBuildings: () => {
        const now = Date.now()
        set(state => {
          const buildings = state.buildings.filter(b => {
            if (b.status !== 'wilting' || b.wiltingStartedAt === null) return true
            return now - b.wiltingStartedAt < WILT_GRACE_PERIOD_MS
          })
          return { buildings, prosperityValue: calculateProsperity(buildings) }
        })
      },

      setLastVisit: (timestamp) => {
        set({ lastVisitAt: timestamp })
      },
    }),
    {
      name: 'milk-honey-city',
    }
  )
)
