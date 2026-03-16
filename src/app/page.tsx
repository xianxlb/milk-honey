'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ensureUser, getPortfolio } from '@/lib/client-api'
import { getBuildingEmoji, getBuildingImage, getBuildingName } from '@/lib/building-images'

export default function HomePage() {
  const { ready, authenticated, getAccessToken, walletAddress } = useAuth()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPortfolio = useCallback(async () => {
    try {
      const token = await getAccessToken()
      if (!token) return
      await ensureUser(token)
      const data = await getPortfolio(token)
      setPortfolio(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load portfolio:', err)
      setError('Failed to load your city')
    } finally {
      setLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (authenticated) loadPortfolio()
  }, [authenticated, loadPortfolio])

  useEffect(() => {
    const handleFocus = () => { if (authenticated) loadPortfolio() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [authenticated, loadPortfolio])

  if (!ready || (authenticated && loading)) {
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
          <p className="text-[#DC2626] font-semibold mb-4">{error ?? 'Something went wrong'}</p>
          <button onClick={() => loadPortfolio()} className="px-6 py-3 bg-[#6CB4E8] text-white rounded-xl font-semibold">Retry</button>
        </div>
      </div>
    )
  }

  const { cards, packs, stats } = portfolio
  // Amounts from API are in USDC micro-units (6 decimals) — divide by 1_000_000 for dollars
  const totalDollars = stats.totalDepositedUsdc / 1_000_000
  const yieldDollars = stats.yieldEarnedUsdc / 1_000_000
  const nextMilestone = Math.ceil(Math.max(totalDollars, 0.01) / 100) * 100
  const progress = ((totalDollars % 100) / 100) * 100
  const amountUntilReward = Math.max(0, nextMilestone - totalDollars)
  const gridClass = cards.length <= 6 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">
      {/* Header */}
      <header className="bg-[#6CB4E8] px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-3 right-6 w-24 h-12 bg-white/30 rounded-full" />
        <div className="absolute top-6 right-16 w-16 h-8 bg-white/20 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center border-2 border-white/40 overflow-hidden">
                <img src="/mascot.png" alt="Mascot" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>Milk & Honey</h1>
                <p className="text-white/70 text-sm font-medium">Build your village!</p>
              </div>
            </div>
            <div className="bg-[#F0C430] rounded-xl px-3 py-2 border-2 border-[#1A1A1A]/10 shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                <p className="text-[#1A1A1A] font-bold text-lg leading-tight" style={{ fontFamily: 'Fredoka' }}>{stats.apyPercent.toFixed(2)}%</p>
              </div>
              <p className="text-[#1A1A1A]/60 text-[10px] font-semibold text-right">APY</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/30">
            <p className="text-white/70 text-sm mb-1 font-medium">Total Savings</p>
            <p className="text-5xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: 'Fredoka' }}>
              ${totalDollars.toFixed(2)}
            </p>
            <div className="mb-3">
              <div className="bg-white/20 rounded-full h-3.5 overflow-hidden border border-white/20">
                {progress > 0 && (
                  <div className="bg-[#F0C430] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                )}
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium">
              Deposit <span className="font-bold text-white">${amountUntilReward.toFixed(2)}</span> more to unlock your next building
            </p>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        {packs.length > 0 && (
          <Link href={`/open-pack?packId=${packs[0].id}`}
            className="block mb-6 bg-[#F0C430] rounded-2xl p-4 shadow-lg border-2 border-[#1A1A1A]/10 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center border-2 border-[#1A1A1A]/10">
                <span className="text-2xl">🎁</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1A1A1A]">{packs.length} Unopened Pack{packs.length > 1 ? 's' : ''}!</p>
                <p className="text-[#1A1A1A]/60 text-sm font-medium">Tap to reveal your building</p>
              </div>
            </div>
          </Link>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: 'Fredoka' }}>Your Village</h2>
          <p className="text-[#1A1A1A]/50 font-medium">{cards.length} building{cards.length !== 1 ? 's' : ''}</p>
        </div>

        {cards.length === 0 ? (
          <div className="bg-[#FBF8F2] rounded-2xl border-2 border-dashed border-[#1A1A1A]/15 p-8 mb-8 text-center">
            <img src="/mascot.png" alt="Mascot" className="w-20 h-20 mx-auto mb-3 opacity-60" />
            <p className="text-[#1A1A1A]/70 font-semibold mb-1">No buildings yet</p>
            <p className="text-sm text-[#1A1A1A]/40">Deposit $100 USDC to unlock your first building!</p>
          </div>
        ) : (
          <div className={`grid ${gridClass} gap-4 mb-8`}>
            {cards.map((card: any) => (
              <Link key={card.id} href={`/building/${card.id}`}
                className="relative bg-[#FBF8F2] rounded-2xl p-3 shadow-md border-2 border-[#1A1A1A]/8 hover:scale-105 hover:shadow-lg transition-all active:scale-95">
                <div className="aspect-square bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                  {getBuildingImage(card.building_type) ? (
                    <img src={getBuildingImage(card.building_type)!} alt={getBuildingName(card.building_type)} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-5xl">{getBuildingEmoji(card.building_type)}</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-[#1A1A1A] truncate">{getBuildingName(card.building_type)}</p>
                  <p className="text-[10px] text-[#1A1A1A]/40 font-medium">Lv.{card.level}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {stats.yieldEarnedUsdc > 0 && (
          <div className="bg-[#FBF8F2] rounded-2xl p-4 border-2 border-[#6CB4E8]/20 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6CB4E8] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1A1A1A]">Yield Earned</p>
                <p className="text-sm text-[#6CB4E8] font-bold">+${yieldDollars.toFixed(6)}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-[#F5F0E8]/80 backdrop-blur-lg border-t-2 border-[#1A1A1A]/5 px-6 py-4">
        <div className="max-w-md mx-auto">
          <Link href="/deposit"
            className="w-full bg-[#F0C430] text-[#1A1A1A] py-4 px-6 rounded-2xl font-bold shadow-lg border-2 border-[#1A1A1A]/10 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Deposit USDC
          </Link>
        </div>
      </div>
    </div>
  )
}
