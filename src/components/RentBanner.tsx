'use client'

import { useState } from 'react'

interface RentBannerProps {
  yieldSinceLastVisit: number
}

export default function RentBanner({ yieldSinceLastVisit }: RentBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || yieldSinceLastVisit <= 0) return null

  return (
    <div
      className="mx-4 mt-2 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between cursor-pointer active:bg-green-100"
      onClick={() => setDismissed(true)}
    >
      <div>
        <p className="text-sm font-medium text-green-800">
          🏠 Rent: You&apos;ve made ${yieldSinceLastVisit.toFixed(2)} since your last check-in!
        </p>
        <p className="text-xs text-green-600 mt-0.5">Tap buildings to collect tokens</p>
      </div>
      <span className="text-green-400 text-xl">✕</span>
    </div>
  )
}
