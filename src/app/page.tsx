'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, Plus } from 'lucide-react'
import { ensureCity, getPortfolio, clearCityId, type Portfolio } from '@/lib/api'
import { getBuildingEmoji, getBuildingImage, getBuildingName } from '@/lib/building-images'

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

  useEffect(() => {
    const handleFocus = () => { loadPortfolio() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadPortfolio])

  // Yield ticker — accelerated 500x for demo visibility
  useEffect(() => {
    if (!portfolio) return
    const totalCents = portfolio.stats.totalDepositedCents
    if (totalCents <= 0) return

    const realRatePerMs = (totalCents * 0.05) / (365 * 24 * 60 * 60 * 1000 * 100)
    const demoRate = realRatePerMs * 500

    const interval = setInterval(() => {
      setDisplayTotal(prev => prev + demoRate * 50)
    }, 50)

    return () => clearInterval(interval)
  }, [portfolio])

  const handleResetApp = () => {
    clearCityId()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#6CB4E8]/30 border-t-[#6CB4E8] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1A1A1A]/50 font-medium">Loading your village...</p>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#DC2626] font-semibold mb-4">{error || 'Something went wrong'}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#6CB4E8] text-white rounded-xl font-semibold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { cards, packs, stats } = portfolio
  const totalDeposits = displayTotal
  const currentDollars = Math.floor(stats.totalDepositedCents / 100)
  const nextMilestone = currentDollars > 0 && currentDollars % 100 === 0
    ? currentDollars + 100
    : Math.ceil(Math.max(currentDollars, 1) / 100) * 100
  const amountUntilReward = nextMilestone - currentDollars
  const progress = ((currentDollars % 100) / 100) * 100

  const gridCols = cards.length <= 6 ? 2 : 3
  const gridClass = gridCols === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FBF8F2] rounded-3xl p-8 shadow-2xl max-w-sm mx-6 border-2 border-[#1A1A1A]/10">
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3" style={{ fontFamily: 'Fredoka' }}>
              Reset App?
            </h3>
            <p className="text-[#1A1A1A]/50 mb-6">
              This will clear all your deposits, buildings, and progress. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F5F0E8] text-[#1A1A1A] font-semibold border-2 border-[#1A1A1A]/10 hover:bg-[#EDE8DC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetApp}
                className="flex-1 py-3 px-4 rounded-xl bg-[#DC2626] text-white font-semibold hover:shadow-lg transition-all active:scale-95"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#6CB4E8] px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        {/* Cloud shapes */}
        <div className="absolute top-3 right-6 w-24 h-12 bg-white/30 rounded-full" />
        <div className="absolute top-6 right-16 w-16 h-8 bg-white/20 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-20 h-10 bg-white/15 rounded-full" />

        <div className="relative z-10">
          {/* Top bar: mascot + name + APY */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center border-2 border-white/40 overflow-hidden">
                <img src="/mascot.png" alt="Mascot" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                  Milk & Honey
                </h1>
                <p className="text-white/70 text-sm font-medium">Build your village!</p>
              </div>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="bg-[#F0C430] rounded-xl px-3 py-2 border-2 border-[#1A1A1A]/10 shadow-md"
            >
              <p className="text-[#1A1A1A] font-bold text-lg leading-tight" style={{ fontFamily: 'Fredoka' }}>{stats.apyPercent}%</p>
              <p className="text-[#1A1A1A]/60 text-[10px] font-semibold">APY</p>
            </button>
          </div>

          {/* Savings Display */}
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/30">
            <p className="text-white/70 text-sm mb-1 font-medium">Total Savings</p>
            <p className="text-5xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: 'Fredoka' }}>
              ${stats.totalDepositedCents > 0 ? totalDeposits.toFixed(4) : '0.00'}
            </p>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="bg-white/20 rounded-full h-3.5 overflow-hidden border border-white/20">
                {progress > 0 && (
                  <div
                    className="bg-[#F0C430] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(Math.min(progress, 100), 8)}%` }}
                  />
                )}
              </div>
            </div>

            <p className="text-white/90 text-sm font-medium">
              Deposit <span className="font-bold text-white">${amountUntilReward}</span> more to unlock your next building
            </p>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        {/* Unopened Packs Banner */}
        {packs.length > 0 && (
          <Link
            href={`/open-pack?packId=${packs[0].id}`}
            className="block mb-6 bg-[#F0C430] rounded-2xl p-4 shadow-lg border-2 border-[#1A1A1A]/10 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center border-2 border-[#1A1A1A]/10">
                <span className="text-2xl">🎁</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1A1A1A]">
                  {packs.length} Unopened Pack{packs.length > 1 ? 's' : ''}!
                </p>
                <p className="text-[#1A1A1A]/60 text-sm font-medium">Tap to reveal your building</p>
              </div>
            </div>
          </Link>
        )}

        {/* Village Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: 'Fredoka' }}>
            Your Village
          </h2>
          <p className="text-[#1A1A1A]/50 font-medium">
            {cards.length} building{cards.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Buildings Grid */}
        {cards.length === 0 ? (
          <div className="bg-[#FBF8F2] rounded-2xl border-2 border-dashed border-[#1A1A1A]/15 p-8 mb-8 text-center">
            <img src="/mascot.png" alt="Mascot" className="w-20 h-20 mx-auto mb-3 opacity-60" />
            <p className="text-[#1A1A1A]/70 font-semibold mb-1">No buildings yet</p>
            <p className="text-sm text-[#1A1A1A]/40">Deposit $100 to unlock your first building!</p>
          </div>
        ) : (
        <div className={`grid ${gridClass} gap-4 mb-8`}>
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/building/${card.id}`}
              className="relative bg-[#FBF8F2] rounded-2xl p-3 shadow-md border-2 border-[#1A1A1A]/8 hover:scale-105 hover:shadow-lg transition-all active:scale-95"
            >
              <div className="aspect-square bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                {getBuildingImage(card.buildingType) ? (
                  <img src={getBuildingImage(card.buildingType)!} alt={getBuildingName(card.buildingType)} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-5xl">{getBuildingEmoji(card.buildingType)}</span>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                  {getBuildingName(card.buildingType)}
                </p>
                <p className="text-[10px] text-[#1A1A1A]/40 font-medium">
                  Lv.{card.level}
                </p>
              </div>
            </Link>
          ))}
        </div>
        )}

        {/* Yield Earned */}
        {stats.yieldEarnedCents > 0 && (
          <div className="bg-[#FBF8F2] rounded-2xl p-4 border-2 border-[#6CB4E8]/20 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6CB4E8] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1A1A1A]">Yield Earned</p>
                <p className="text-sm text-[#6CB4E8] font-bold">
                  +${(stats.yieldEarnedCents / 100).toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F5F0E8]/80 backdrop-blur-lg border-t-2 border-[#1A1A1A]/5 px-6 py-4">
        <div className="max-w-md mx-auto">
          <Link
            href="/deposit"
            className="w-full bg-[#F0C430] text-[#1A1A1A] py-4 px-6 rounded-2xl font-bold shadow-lg border-2 border-[#1A1A1A]/10 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Deposit Money
          </Link>
        </div>
      </div>
    </div>
  )
}
