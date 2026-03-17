'use client'

import { useEffect, useState } from 'react'

interface Props {
  lastDepositAt: Date | null // null = never deposited
  hasAnimals: boolean
}

function shouldShowRaccoon(lastDepositAt: Date | null, hasAnimals: boolean): boolean {
  if (!hasAnimals) return false
  if (!lastDepositAt) return false
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return Date.now() - lastDepositAt.getTime() > sevenDaysMs
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10) // "2026-03-17"
}

export function RaccoonEvent({ lastDepositAt, hasAnimals }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!shouldShowRaccoon(lastDepositAt, hasAnimals)) return
    const dismissed = localStorage.getItem('raccoon_dismissed_date')
    if (dismissed === getTodayString()) return
    setVisible(true)
  }, [lastDepositAt, hasAnimals])

  const dismiss = () => {
    localStorage.setItem('raccoon_dismissed_date', getTodayString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="mx-4 mb-4 bg-[#FBF8F2] rounded-2xl border-2 border-[#1A1A1A]/8 p-4 flex items-center gap-4 cursor-pointer shadow-md"
      onClick={dismiss}
    >
      {/* Raccoon animation */}
      <div className="text-4xl animate-bounce flex-shrink-0">🦝</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1A1A1A] mb-0.5">A visitor appeared...</p>
        <p className="text-xs text-[#1A1A1A]/50 italic">one man&apos;s trash is another man&apos;s treasure</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); dismiss() }}
        className="text-[#1A1A1A]/30 text-lg flex-shrink-0"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
