'use client'

import { Building } from '@/store/types'
import { useCityStore } from '@/store/city-store'
import BuildingArt from './BuildingArt'
import { BUILDING_TYPES } from '@/lib/constants'
import { useRouter } from 'next/navigation'

interface BuildingTileProps {
  building: Building
}

export default function BuildingTile({ building }: BuildingTileProps) {
  const { collectRent, confirmLevelUp } = useCityStore()
  const router = useRouter()
  const config = BUILDING_TYPES.find(b => b.type === building.type)!

  const handleTap = () => {
    if (building.pendingLevelUp) {
      confirmLevelUp(building.id)
      return
    }
    if (building.uncollectedYield > 0) {
      collectRent(building.id)
      return
    }
    router.push(`/building/${building.id}`)
  }

  return (
    <div
      className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
      onClick={handleTap}
    >
      <BuildingArt
        type={building.type}
        level={building.level}
        isWilting={building.status === 'wilting'}
        showLevelUp={building.pendingLevelUp}
      />
      <p className="text-[10px] text-gray-500 font-medium">{config.name}</p>
      <p className="text-[10px] text-gray-400">L{building.level}</p>
      {building.uncollectedYield > 0 && !building.pendingLevelUp && (
        <div className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
          🪙 +{Math.floor(building.uncollectedYield * 10)}
        </div>
      )}
    </div>
  )
}
