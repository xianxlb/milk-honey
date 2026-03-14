'use client'

import { useEffect } from 'react'
import { useCityStore } from '@/store/city-store'
import { getJupiterLendPosition } from '@/lib/jupiter-lend'

export function useYieldSync() {
  useEffect(() => {
    async function syncYield() {
      try {
        const position = await getJupiterLendPosition()
        if (!position) return

        // Snapshot current state to avoid stale reads during iteration
        const { buildings, updateBuildingYield } = useCityStore.getState()

        // For hackathon: distribute yield proportionally across buildings
        const totalDeposited = buildings.reduce((sum, b) => sum + b.depositValue, 0)
        if (totalDeposited === 0) return

        const totalOnChain = position.totalBalance
        const totalYield = totalOnChain - totalDeposited
        if (totalYield <= 0) return

        buildings.forEach(b => {
          const share = b.depositValue / totalDeposited
          const buildingYield = totalYield * share
          const newYield = buildingYield - b.yieldEarned
          if (newYield > 0.001) {
            updateBuildingYield(b.id, newYield)
          }
        })
      } catch (error) {
        console.error('Yield sync failed:', error)
      }
    }

    syncYield()
  }, []) // Sync on mount
}
