'use client'

import { useState } from 'react'
import { useCityStore } from '@/store/city-store'
import BuildingTile from './BuildingTile'
import { useRouter } from 'next/navigation'
import { canSpawnBuilding } from '@/lib/game-logic'

export default function CityView() {
  const { buildings, spawnTimestamps } = useCityStore()
  const router = useRouter()
  const showSpawnButton = canSpawnBuilding(buildings, spawnTimestamps, Date.now())
  const [showMerge, setShowMerge] = useState(false)

  // suppress unused variable warning for now — MergeModal not yet implemented
  void showMerge

  return (
    <div className="flex-1 px-4 py-4">
      {buildings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-4xl mb-4">🏘️</p>
          <p className="text-gray-600 font-medium">Your city is empty!</p>
          <p className="text-gray-400 text-sm mt-1">Make your first deposit to build</p>
          <button
            className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-full font-medium active:bg-amber-600"
            onClick={() => router.push('/deposit')}
          >
            Build Your First Building
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            {buildings.map(building => (
              <BuildingTile key={building.id} building={building} />
            ))}
          </div>
          {showSpawnButton && (
            <button
              className="mt-6 w-full py-3 bg-amber-500 text-white rounded-xl font-medium active:bg-amber-600"
              onClick={() => router.push('/deposit')}
            >
              + New Deposit
            </button>
          )}
          {buildings.length >= 2 && (
            <button
              className="mt-3 w-full py-3 bg-purple-500 text-white rounded-xl font-medium active:bg-purple-600"
              onClick={() => setShowMerge(true)}
            >
              🔀 Merge Buildings
            </button>
          )}
        </>
      )}
    </div>
  )
}
