'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, Plus, Coins, Star, Settings, TrendingUp } from 'lucide-react'
import { ensureCity, getPortfolio, clearCityId, type Portfolio } from '@/lib/api'
import { getBuildingEmoji, getBuildingImage, getBuildingName } from '@/lib/building-images'
import confetti from 'canvas-confetti'

export default function HomePage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [displayTotal, setDisplayTotal] = useState(0)

  const loadPortfolio = useCallback(async () => {
    try {
      const cityId = await ensureCity()
      const data = await getPortfolio(cityId)
      setPortfolio(data)
      const totalDollars = (data.stats.totalDepositedCents + data.stats.yieldEarnedCents) / 100
      setDisplayTotal(totalDollars)
      setError(null)
    } catch (err) {
      console.error('Failed to load portfolio:', err)
      setError('Failed to load your city')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPortfolio()
  }, [loadPortfolio])

  // Refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => { loadPortfolio() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadPortfolio])

  // Yield ticker: tick up based on 5% APY
  useEffect(() => {
    if (!portfolio) return
    const totalCents = portfolio.stats.totalDepositedCents
    if (totalCents <= 0) return

    const ratePerMs = (totalCents * 0.05) / (365 * 24 * 60 * 60 * 1000 * 100) // dollars per ms
    const interval = setInterval(() => {
      setDisplayTotal(prev => prev + ratePerMs * 50)
    }, 50)

    return () => clearInterval(interval)
  }, [portfolio])

  const handleResetApp = () => {
    clearCityId()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5B9BD5]/30 border-t-[#5B9BD5] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading your village...</p>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#EF4444] font-semibold mb-4">{error || 'Something went wrong'}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#5B9BD5] text-white rounded-xl font-semibold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { cards, packs, stats } = portfolio
  const totalDeposits = displayTotal
  const nextMilestone = Math.ceil((stats.totalDepositedCents / 100) / 100) * 100 || 100
  const currentDepositsFloor = Math.floor(stats.totalDepositedCents / 100)
  const progress = ((currentDepositsFloor % 100) / 100) * 100
  const amountUntilReward = nextMilestone - currentDepositsFloor

  // Grid layout
  const gridCols = cards.length <= 6 ? 2 : 3
  const maxVisibleSlots = gridCols * 3
  const emptySlots = Math.max(0, Math.min(maxVisibleSlots - cards.length, 3))
  const gridClass = gridCols === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] pb-24">
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-6">
            <h3 className="text-2xl font-bold text-[#1F2937] mb-3" style={{ fontFamily: 'Fredoka' }}>
              Reset App?
            </h3>
            <p className="text-[#6B7280] mb-6">
              This will clear all your deposits, buildings, and progress. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F3F4F6] text-[#1F2937] font-semibold hover:bg-[#E5E7EB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetApp}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white font-semibold hover:shadow-lg transition-all active:scale-95"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] px-6 pt-12 pb-6 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                Honey Milk
              </h1>
              <p className="text-white/80 text-sm">Build your village!</p>
            </div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Savings Display */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
          <p className="text-white/80 text-sm mb-2">Total Deposits</p>
          <p className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            ${totalDeposits.toFixed(4)}
          </p>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="bg-white/20 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FFA94D] to-[#FF9529] h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                {progress > 15 && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-white">
            <p className="text-sm flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              ${amountUntilReward.toFixed(0)} until building
            </p>
            <p className="text-sm font-semibold">${nextMilestone}</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        {/* Unopened Packs Banner */}
        {packs.length > 0 && (
          <Link
            href={`/open-pack?packId=${packs[0].id}`}
            className="block mb-6 bg-gradient-to-r from-[#FFA94D] to-[#FF9529] rounded-2xl p-4 shadow-lg animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">
                  {packs.length} Unopened Pack{packs.length > 1 ? 's' : ''}!
                </p>
                <p className="text-white/80 text-sm">Tap to reveal your building</p>
              </div>
            </div>
          </Link>
        )}

        {/* Village Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1F2937] mb-1" style={{ fontFamily: 'Fredoka' }}>
            Your Village
          </h2>
          <p className="text-[#6B7280]">
            {cards.length} building{cards.length !== 1 ? 's' : ''} · {emptySlots} empty slot{emptySlots !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Buildings Grid */}
        <div className={`grid ${gridClass} gap-4 mb-8`}>
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/building/${card.id}`}
              className="relative bg-white rounded-2xl p-3 shadow-lg border border-black/5 hover:scale-105 transition-transform active:scale-95"
            >
              <div className="aspect-square bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                {getBuildingImage(card.buildingType) ? (
                  <img src={getBuildingImage(card.buildingType)!} alt={getBuildingName(card.buildingType)} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-5xl">{getBuildingEmoji(card.buildingType)}</span>
                )}
              </div>

              {/* Level Badge */}
              {card.level > 0 && (
                <div className="absolute top-1 right-1 bg-gradient-to-r from-[#FFA94D] to-[#FF9529] rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-xs font-bold text-white">{card.level}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-1">
                <p className="text-xs font-semibold text-[#1F2937] text-center truncate">
                  {getBuildingName(card.buildingType)}
                </p>
                {card.level > 0 && (
                  <span className="text-xs text-[#FFA94D] font-bold">★{card.level}</span>
                )}
              </div>
            </Link>
          ))}

          {/* Empty Slots */}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-square bg-white/50 rounded-2xl border-2 border-dashed border-[#6B7280]/30 flex flex-col items-center justify-center p-3"
            >
              <Sparkles className="w-6 h-6 text-[#6B7280]/30 mb-1" />
              <p className="text-xs text-[#6B7280]/50 text-center">Locked</p>
            </div>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-gradient-to-br from-[#5B9BD5]/10 to-white rounded-2xl p-4 border border-[#5B9BD5]/20">
            <div className="w-10 h-10 bg-[#5B9BD5] rounded-xl flex items-center justify-center mb-2">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-[#1F2937]" style={{ fontFamily: 'Fredoka' }}>
              ${(stats.totalDepositedCents / 100).toFixed(0)}
            </p>
            <p className="text-xs text-[#6B7280]">Deposited</p>
          </div>

          <div className="bg-gradient-to-br from-[#FFA94D]/10 to-white rounded-2xl p-4 border border-[#FFA94D]/20">
            <div className="w-10 h-10 bg-[#FFA94D] rounded-xl flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-[#1F2937]" style={{ fontFamily: 'Fredoka' }}>
              {stats.cardCount}
            </p>
            <p className="text-xs text-[#6B7280]">Buildings</p>
          </div>

          <div className="bg-gradient-to-br from-[#7C3AED]/10 to-white rounded-2xl p-4 border border-[#7C3AED]/20">
            <div className="w-10 h-10 bg-[#7C3AED] rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-[#1F2937]" style={{ fontFamily: 'Fredoka' }}>
              {stats.apyPercent}%
            </p>
            <p className="text-xs text-[#6B7280]">APY</p>
          </div>
        </div>

        {/* Yield Earned */}
        {stats.yieldEarnedCents > 0 && (
          <div className="bg-gradient-to-r from-[#10B981]/10 to-white rounded-2xl p-4 border border-[#10B981]/20 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1F2937]">Yield Earned</p>
                <p className="text-sm text-[#10B981] font-bold">
                  +${(stats.yieldEarnedCents / 100).toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-black/5 px-6 py-4">
        <div className="max-w-md mx-auto">
          <Link
            href="/deposit"
            className="w-full bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Deposit Money
          </Link>
        </div>
      </div>
    </div>
  )
}
