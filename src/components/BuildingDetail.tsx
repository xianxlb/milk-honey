'use client'

import { useState } from 'react'
import { useCityStore } from '@/store/city-store'
import { useRouter } from 'next/navigation'
import BuildingArt from './BuildingArt'
import ProgressBar from './ProgressBar'
import { BUILDING_TYPES, LEVEL_THRESHOLDS, MAX_LEVEL } from '@/lib/constants'
import { withdraw as withdrawFromYield } from '@/lib/yield-router'

interface BuildingDetailProps {
  buildingId: string
}

export default function BuildingDetail({ buildingId }: BuildingDetailProps) {
  const router = useRouter()
  const { buildings, withdrawPartial, withdrawFull, upgradeBuilding } = useCityStore()
  const building = buildings.find(b => b.id === buildingId)

  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  if (!building) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Building not found</p>
        <button className="mt-4 text-amber-600 underline" onClick={() => router.push('/')}>
          Back to city
        </button>
      </div>
    )
  }

  const config = BUILDING_TYPES.find(b => b.type === building.type)!
  const nextThreshold = building.level < MAX_LEVEL ? LEVEL_THRESHOLDS[building.level] : null

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) return
    setProcessing(true)
    try {
      await withdrawFromYield(amount, building.yieldSource)
      if (amount >= building.totalValue) {
        withdrawFull(building.id)
      } else {
        withdrawPartial(building.id, amount)
      }
      router.push('/')
    } catch (err) {
      console.error('Withdrawal failed:', err)
      setProcessing(false)
    }
  }

  return (
    <div className="p-4">
      <button className="text-amber-600 text-sm mb-4" onClick={() => router.push('/')}>
        ← Back to city
      </button>

      <div className="flex flex-col items-center">
        <BuildingArt
          type={building.type}
          level={building.level}
          isWilting={building.status === 'wilting'}
        />
        <h2 className="text-xl font-bold text-gray-800 mt-4">
          {config.emoji} {config.name}
        </h2>
        <p className="text-amber-600 font-medium">Level {building.level}</p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between p-3 bg-white rounded-xl border border-gray-100">
          <span className="text-gray-500">Total Value</span>
          <span className="font-bold text-gray-800">${building.totalValue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between p-3 bg-white rounded-xl border border-gray-100">
          <span className="text-gray-500">Yield Earned</span>
          <span className="font-bold text-green-600">+${building.yieldEarned.toFixed(2)}</span>
        </div>
        <div className="flex justify-between p-3 bg-white rounded-xl border border-gray-100">
          <span className="text-gray-500">Status</span>
          <span className={`font-bold ${building.status === 'wilting' ? 'text-red-500' : 'text-green-600'}`}>
            {building.status === 'wilting' ? '🥀 Wilting' : '✅ Active'}
          </span>
        </div>

        {nextThreshold && (
          <ProgressBar
            current={building.totalValue}
            target={nextThreshold}
            label={`Progress to Level ${building.level + 1}`}
            className="p-3 bg-white rounded-xl border border-gray-100"
          />
        )}
      </div>

      {building.status === 'wilting' && (
        <div className="mt-6">
          <p className="text-sm text-red-500 mb-3">This building is closing down. Re-deposit to save it!</p>
          <button
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium active:bg-amber-600"
            onClick={() => router.push('/deposit')}
          >
            🏗️ Save This Building
          </button>
        </div>
      )}

      {building.status !== 'wilting' && (
        <div className="mt-6">
          {!showWithdraw ? (
            <button
              className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl font-medium active:bg-red-50"
              onClick={() => setShowWithdraw(true)}
            >
              Withdraw
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">$</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder={building.totalValue.toFixed(2)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl"
                  min="0"
                  max={building.totalValue}
                  step="0.01"
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium active:bg-red-600 disabled:opacity-50"
                  disabled={processing}
                  onClick={handleWithdraw}
                >
                  {processing ? 'Processing...' : 'Confirm Withdraw'}
                </button>
                <button
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium active:bg-gray-50"
                  onClick={() => setShowWithdraw(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
