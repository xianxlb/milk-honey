'use client'

import { useState } from 'react'
import { useCityStore } from '@/store/city-store'
import { useRouter } from 'next/navigation'
import {
  canSpawnBuilding,
  getAvailableBuildingTypes,
  validateDeposit,
} from '@/lib/game-logic'
import { BuildingType } from '@/store/types'
import BuildingArt from './BuildingArt'
import { deposit as depositToYield } from '@/lib/yield-router'

type Step = 'amount' | 'action' | 'choose-type' | 'choose-building' | 'confirm' | 'processing' | 'done'

export default function DepositFlow() {
  const router = useRouter()
  const {
    buildings,
    spawnTimestamps,
    prosperityValue,
    spawnBuilding,
    upgradeBuilding,
  } = useCityStore()

  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState<'spawn' | 'upgrade'>('spawn')
  const [selectedType, setSelectedType] = useState<BuildingType | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = parseFloat(amount) || 0
  const isFirstDeposit = buildings.length === 0
  const canSpawn = canSpawnBuilding(buildings, spawnTimestamps, Date.now())
  const availableTypes = getAvailableBuildingTypes(prosperityValue)

  const handleAmountSubmit = () => {
    if (isFirstDeposit || !canSpawn) {
      // First deposit always spawns; if can't spawn, auto-upgrade
      const validation = validateDeposit(parsedAmount, isFirstDeposit ? 'spawn' : 'upgrade')
      if (!validation.valid) {
        setError(validation.error!)
        return
      }
      if (isFirstDeposit) {
        setAction('spawn')
        setStep('choose-type')
      } else {
        setAction('upgrade')
        setStep('choose-building')
      }
    } else {
      setStep('action')
    }
  }

  const handleActionChoice = (chosen: 'spawn' | 'upgrade') => {
    const validation = validateDeposit(parsedAmount, chosen)
    if (!validation.valid) {
      setError(validation.error!)
      return
    }
    setAction(chosen)
    if (chosen === 'spawn') {
      setStep('choose-type')
    } else {
      setStep('choose-building')
    }
  }

  const handleConfirm = async () => {
    setStep('processing')
    try {
      // On-chain deposit
      const { source } = await depositToYield(parsedAmount)

      // Update game state
      if (action === 'spawn' && selectedType) {
        spawnBuilding(selectedType, parsedAmount, source)
      } else if (action === 'upgrade' && selectedBuildingId) {
        upgradeBuilding(selectedBuildingId, parsedAmount)
      }
      setStep('done')
    } catch (err) {
      setError('Transaction failed. Please try again.')
      setStep('amount')
    }
  }

  return (
    <div className="p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>dismiss</button>
        </div>
      )}

      {step === 'amount' && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">How much USDC?</h2>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400 text-lg">$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="100.00"
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-lg"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex gap-2 mt-3">
            {[100, 500, 1000].map(preset => (
              <button
                key={preset}
                className="flex-1 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm active:bg-amber-100"
                onClick={() => setAmount(preset.toString())}
              >
                ${preset}
              </button>
            ))}
          </div>
          <button
            className="mt-6 w-full py-3 bg-amber-500 text-white rounded-xl font-medium disabled:opacity-50 active:bg-amber-600"
            disabled={parsedAmount <= 0}
            onClick={handleAmountSubmit}
          >
            Continue
          </button>
        </div>
      )}

      {step === 'action' && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">What would you like to do?</h2>
          <div className="space-y-3">
            <button
              className="w-full p-4 border-2 border-amber-200 rounded-xl text-left active:border-amber-500 active:bg-amber-50"
              onClick={() => handleActionChoice('spawn')}
            >
              <p className="font-medium text-gray-800">🏗️ Build New</p>
              <p className="text-sm text-gray-500 mt-1">Add a new building to your city</p>
            </button>
            <button
              className="w-full p-4 border-2 border-amber-200 rounded-xl text-left active:border-amber-500 active:bg-amber-50"
              onClick={() => handleActionChoice('upgrade')}
            >
              <p className="font-medium text-gray-800">⬆️ Upgrade Existing</p>
              <p className="text-sm text-gray-500 mt-1">Level up a building you already have</p>
            </button>
          </div>
        </div>
      )}

      {step === 'choose-type' && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Choose a building</h2>
          <div className="grid grid-cols-2 gap-3">
            {availableTypes.map(bt => (
              <button
                key={bt.type}
                className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 active:bg-amber-50 ${
                  selectedType === bt.type ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedType(bt.type)}
              >
                <BuildingArt type={bt.type} level={1} />
                <p className="text-sm font-medium text-gray-700">{bt.name}</p>
              </button>
            ))}
          </div>
          <button
            className="mt-6 w-full py-3 bg-amber-500 text-white rounded-xl font-medium disabled:opacity-50 active:bg-amber-600"
            disabled={!selectedType}
            onClick={() => setStep('confirm')}
          >
            Continue
          </button>
        </div>
      )}

      {step === 'choose-building' && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Choose a building to upgrade</h2>
          <div className="space-y-3">
            {buildings.map(b => {
              const config = availableTypes.find(t => t.type === b.type)
              return (
                <button
                  key={b.id}
                  className={`w-full p-3 border-2 rounded-xl flex items-center gap-3 text-left active:bg-amber-50 ${
                    selectedBuildingId === b.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedBuildingId(b.id)}
                >
                  <BuildingArt type={b.type} level={b.level} />
                  <div>
                    <p className="font-medium text-gray-700">{config?.name} L{b.level}</p>
                    <p className="text-sm text-gray-400">${b.totalValue.toFixed(2)}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <button
            className="mt-6 w-full py-3 bg-amber-500 text-white rounded-xl font-medium disabled:opacity-50 active:bg-amber-600"
            disabled={!selectedBuildingId}
            onClick={() => setStep('confirm')}
          >
            Continue
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Confirm Deposit</h2>
          <p className="text-3xl font-bold text-amber-600 mb-2">${parsedAmount.toFixed(2)}</p>
          <p className="text-gray-500 mb-6">
            {action === 'spawn' ? `New ${selectedType?.replace('-', ' ')}` : 'Upgrading existing building'}
          </p>
          <button
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium active:bg-amber-600"
            onClick={handleConfirm}
          >
            Deposit & Build
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">🔨</div>
          <p className="text-gray-600">Building...</p>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🎉</p>
          <p className="text-lg font-bold text-gray-800">Building complete!</p>
          <button
            className="mt-6 px-6 py-2 bg-amber-500 text-white rounded-full font-medium active:bg-amber-600"
            onClick={() => router.push('/')}
          >
            Back to City
          </button>
        </div>
      )}
    </div>
  )
}
