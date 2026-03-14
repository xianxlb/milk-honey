'use client'

import { useEffect, useState } from 'react'
import { useCityStore } from '@/store/city-store'
import { getBestAPY } from '@/lib/yield-router'

export default function ProsperityBar() {
  const { prosperityValue, tokens } = useCityStore()
  const [apy, setApy] = useState<number | null>(null)

  useEffect(() => {
    getBestAPY().then(({ apy }) => setApy(apy)).catch(() => {})
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-200">
      <div>
        <p className="text-xs text-amber-600 font-medium">Prosperity</p>
        <p className="text-lg font-bold text-amber-800">
          ${prosperityValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs text-amber-600 font-medium">APY</p>
        <p className="text-lg font-bold text-green-600">
          {apy !== null ? `${(apy * 100).toFixed(1)}%` : '—'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-amber-600 font-medium">Tokens</p>
        <p className="text-lg font-bold text-amber-800">🪙 {tokens}</p>
      </div>
    </div>
  )
}
