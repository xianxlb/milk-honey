'use client'

import { useEffect, useState } from 'react'
import { useCityStore } from '@/store/city-store'

export function useRentCollection() {
  const { buildings, setLastVisit, removeExpiredBuildings } = useCityStore()
  const [yieldSinceLastVisit, setYieldSinceLastVisit] = useState(0)

  useEffect(() => {
    removeExpiredBuildings()
    const totalUncollected = buildings.reduce((sum, b) => sum + b.uncollectedYield, 0)
    setYieldSinceLastVisit(totalUncollected)
    setLastVisit(Date.now())
  }, []) // Only run on mount

  return { yieldSinceLastVisit }
}
