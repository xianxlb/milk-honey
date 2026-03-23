'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { usePortfolio } from '@/contexts/portfolio-context'
import { useTransactionSender } from '@/hooks/use-transaction-sender'
import { ensureUser, verifyDeposit, getWithdrawTx, recordWithdrawComplete } from '@/lib/client-api'
import { BottomNav } from '@/components/bottom-nav'
import { getAnimalEmoji, getAnimalImage } from '@/lib/animal-images'
import { getAnimalName, type AnimalType } from '@/lib/animals'
import { RaccoonEvent } from '@/components/RaccoonEvent'

type PendingVerification = { txSignature: string; amountUsdc: number }

export default function HomePage() {
  const router = useRouter()
  const { ready, authenticated } = useAuth()
  const { sendTx } = useTransactionSender()
  const { portfolio, pendingWithdrawal, loading, error, refresh, getToken } = usePortfolio()

  const [liveTotal, setLiveTotal] = useState(0)
  const [pendingVerify, setPendingVerify] = useState<PendingVerification | null>(null)
  const [completingWithdrawal, setCompletingWithdrawal] = useState(false)
  const rafRef = useRef<number>(0)
  const lastTsRef = useRef<number>(0)
  const ratePerMsRef = useRef<number>(0)

  // Ensure user is registered on first load
  useEffect(() => {
    if (!authenticated) return
    getToken().then(token => { if (token) ensureUser(token) })
  }, [authenticated, getToken])

  const handleCompleteWithdrawal = useCallback(async () => {
    if (completingWithdrawal) return
    setCompletingWithdrawal(true)
    try {
      const token = await getToken()
      if (!token) return
      const { transaction: txBase64 } = await getWithdrawTx(token, 'complete')
      const txSignature = await sendTx(txBase64)
      await recordWithdrawComplete(token, txSignature)
      await refresh()
    } catch (err) {
      console.error('Failed to complete withdrawal:', err)
    } finally {
      setCompletingWithdrawal(false)
    }
  }, [completingWithdrawal, getToken, sendTx, refresh])

  // When portfolio loads/refreshes: update rate and sync forward (never back)
  useEffect(() => {
    if (!portfolio) return
    const { stats } = portfolio
    const totalDollars = stats.totalDepositedUsdc / 1_000_000
    const yieldDollars = stats.yieldEarnedUsdc / 1_000_000
    const currentPositionDollars = totalDollars + yieldDollars
    ratePerMsRef.current = currentPositionDollars > 0 && stats.apyPercent > 0
      ? currentPositionDollars * (stats.apyPercent / 100) / (365 * 24 * 3600 * 1000)
      : 0
    setLiveTotal(prev => Math.max(prev, currentPositionDollars))
  }, [portfolio])

  // Pick up pending verification from deposit page
  useEffect(() => {
    const stored = sessionStorage.getItem('pending_verification')
    if (!stored) return
    try { setPendingVerify(JSON.parse(stored)) } catch { sessionStorage.removeItem('pending_verification') }
  }, [])

  // Run verification loop when we have a pending deposit + auth
  useEffect(() => {
    if (!pendingVerify || !authenticated) return
    let cancelled = false
    const run = async () => {
      const token = await getToken()
      if (!token || cancelled) return
      let result: { packs?: { id: string }[] } | null = null
      for (let attempt = 0; attempt <= 8; attempt++) {
        if (cancelled) return
        try {
          result = await verifyDeposit(token, pendingVerify.txSignature, pendingVerify.amountUsdc)
          break
        } catch (err: unknown) {
          const e = err as { status?: number }
          if (e.status === 409) { result = null; break }
          if (e.status === 400 && attempt < 8) {
            await new Promise(r => setTimeout(r, 3000))
            continue
          }
          break
        }
      }
      if (cancelled) return
      sessionStorage.removeItem('pending_verification')
      setPendingVerify(null)
      await refresh()
      if (result?.packs && result.packs.length > 0) {
        router.push(`/open-pack?packId=${result.packs[0].id}`)
      }
    }
    run()
    return () => { cancelled = true }
  }, [pendingVerify, authenticated, getToken, refresh, router])

  // RAF ticker
  useEffect(() => {
    lastTsRef.current = performance.now()
    const tick = (ts: number) => {
      const elapsed = ts - lastTsRef.current
      lastTsRef.current = ts
      setLiveTotal(prev => prev + ratePerMsRef.current * elapsed)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  if (!ready || (authenticated && loading && !portfolio)) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#6CB4E8]/30 border-t-[#6CB4E8] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1A1A1A]/50 font-medium">Loading your crew...</p>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#DC2626] font-semibold mb-4">{error ?? 'Something went sideways'}</p>
          <button onClick={refresh} className="px-6 py-3 bg-[#6CB4E8] text-white rounded-xl font-semibold">Try Again</button>
        </div>
      </div>
    )
  }

  const { cards, packs, stats } = portfolio
  const totalDollars = stats.totalDepositedUsdc / 1_000_000
  const yieldDollars = stats.yieldEarnedUsdc / 1_000_000
  const positionDollars = totalDollars + yieldDollars
  const ratePerSec = positionDollars > 0 && stats.apyPercent > 0
    ? positionDollars * (stats.apyPercent / 100) / (365 * 24 * 3600)
    : 0
  const displayDecimals = ratePerSec > 0
    ? Math.min(10, Math.max(6, Math.round(-Math.log10(ratePerSec))))
    : 6
  const nextMilestone = Math.ceil(Math.max(positionDollars, 0.01) / 20) * 20
  const progress = ((positionDollars % 20) / 20) * 100
  const amountUntilReward = Math.max(0, nextMilestone - positionDollars)
  const gridClass = cards.length <= 6 ? 'grid-cols-2' : 'grid-cols-3'

  type Card = { id: string; animal_type: string; level: number }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24 pb-safe">
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
                <p className="text-white/70 text-sm font-medium">Grow your crew!</p>
              </div>
            </div>
            <div className="bg-[#F0C430] rounded-xl px-3 py-2 border-2 border-[#1A1A1A]/10 shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                <p className="text-[#1A1A1A] font-bold text-lg leading-tight" style={{ fontFamily: 'Fredoka' }}>{stats.apyPercent.toFixed(2)}%</p>
              </div>
              <p className="text-[#1A1A1A]/60 text-[10px] font-semibold text-right">interest p.a.</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/30">
            <p className="text-white/70 text-sm mb-1 font-medium">Total Savings</p>
            <p className="text-5xl font-bold text-white mb-4 tracking-tight tabular-nums" style={{ fontFamily: 'Fredoka' }}>
              ${liveTotal.toFixed(displayDecimals)}
            </p>
            <div className="mb-3">
              <div className="bg-white/20 rounded-full h-3.5 overflow-hidden border border-white/20">
                {progress > 0 && (
                  <div className="bg-[#F0C430] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                )}
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium">
              Deposit <span className="font-bold text-white">${amountUntilReward.toFixed(2)}</span> more to meet your next crew member
            </p>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        {pendingVerify && (
          <div className="mb-6 bg-[#6CB4E8]/10 rounded-2xl p-4 border-2 border-[#6CB4E8]/30 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#6CB4E8]/30 border-t-[#6CB4E8] rounded-full animate-spin shrink-0" />
            <div>
              <p className="font-bold text-[#1A1A1A]">Your crew is on the way! 🐾</p>
              <p className="text-xs text-[#1A1A1A]/50 font-medium">Checking your deposit...</p>
            </div>
          </div>
        )}

        {pendingWithdrawal && (() => {
          const initiatedMs = new Date(pendingWithdrawal.initiated_at).getTime()
          const readyMs = initiatedMs + pendingWithdrawal.cooldown_seconds * 1000
          const isReady = Date.now() >= readyMs
          const remainingMs = Math.max(0, readyMs - Date.now())
          const hrs = Math.floor(remainingMs / 3600000)
          const mins = Math.ceil((remainingMs % 3600000) / 60000)
          const amountDollars = (pendingWithdrawal.amount_usdc / 1_000_000).toFixed(2)
          return (
            <button
              onClick={isReady ? handleCompleteWithdrawal : undefined}
              disabled={!isReady || completingWithdrawal}
              className={`w-full mb-6 rounded-2xl p-4 shadow-lg border-2 text-left ${
                isReady
                  ? 'bg-[#F0C430] border-[#1A1A1A]/10 cursor-pointer active:scale-95 transition-all'
                  : 'bg-[#FBF8F2] border-[#1A1A1A]/8 cursor-default'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 border-[#1A1A1A]/10 ${isReady ? 'bg-white/40' : 'bg-[#F5F0E8]'}`}>
                  {completingWithdrawal
                    ? <div className="w-6 h-6 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin" />
                    : <span className="text-2xl">💸</span>
                  }
                </div>
                <div className="flex-1">
                  {isReady ? (
                    <>
                      <p className="font-bold text-[#1A1A1A]">Harvest ready · ${amountDollars}</p>
                      <p className="text-[#1A1A1A]/60 text-sm font-medium">Tap to collect</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-[#1A1A1A]">Harvest pending · ${amountDollars}</p>
                      <p className="text-[#1A1A1A]/50 text-sm font-medium">
                        Ready in {hrs > 0 ? `${hrs}h ` : ''}{mins}m
                      </p>
                    </>
                  )}
                </div>
              </div>
            </button>
          )
        })()}

        {packs.length > 0 && (
          <Link href={`/open-pack?packId=${packs[0].id}`}
            className="block mb-6 bg-[#F0C430] rounded-2xl p-4 shadow-lg border-2 border-[#1A1A1A]/10 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center border-2 border-[#1A1A1A]/10">
                <span className="text-2xl">🎁</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1A1A1A]">{packs.length} Unopened Pack{packs.length > 1 ? 's' : ''}!</p>
                <p className="text-[#1A1A1A]/60 text-sm font-medium">Tap to reveal your crew member</p>
              </div>
            </div>
          </Link>
        )}

        <RaccoonEvent
          lastDepositAt={portfolio?.lastDepositAt ? new Date(portfolio.lastDepositAt) : null}
          hasAnimals={(portfolio?.cards?.length ?? 0) > 0}
        />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: 'Fredoka' }}>Your Crew</h2>
          <p className="text-[#1A1A1A]/50 font-medium">{cards.length} animal{cards.length !== 1 ? 's' : ''}</p>
        </div>

        {cards.length === 0 ? (
          <div className="bg-[#FBF8F2] rounded-2xl border-2 border-dashed border-[#1A1A1A]/15 p-8 mb-8 text-center">
            <img src="/mascot.png" alt="Mascot" className="w-20 h-20 mx-auto mb-3 opacity-60" />
            <p className="text-[#1A1A1A]/70 font-semibold mb-1">No crew yet</p>
            <p className="text-sm text-[#1A1A1A]/40">Deposit $20 to meet your first animal!</p>
          </div>
        ) : (
          <div className={`grid ${gridClass} gap-4 mb-8`}>
            {cards.map((card: Card) => {
              const img = getAnimalImage(card.animal_type, card.level)
              const canMerge = cards.some(
                (other: Card) => other.id !== card.id && other.animal_type === card.animal_type && other.level === card.level
              )
              return (
                <Link key={card.id} href={`/animal/${card.id}`}
                  className="relative bg-[#FBF8F2] rounded-2xl p-3 shadow-md border-2 border-[#1A1A1A]/8 hover:scale-105 hover:shadow-lg transition-all active:scale-95">
                  {canMerge && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#F0C430] rounded-full flex items-center justify-center border-2 border-white z-10">
                      <span className="text-[8px] font-bold text-[#1A1A1A]">↑</span>
                    </div>
                  )}
                  <div className="aspect-square bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                    {img
                      ? <img src={img} alt={card.animal_type} className="w-full h-full object-contain" />
                      : <span className="text-5xl">{getAnimalEmoji(card.animal_type)}</span>
                    }
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[#1A1A1A] truncate">{getAnimalName(card.animal_type as AnimalType)}</p>
                    <p className="text-[10px] text-[#1A1A1A]/40 font-medium">Lv.{card.level}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {stats.yieldEarnedUsdc > 0 && (
          <div className="bg-[#FBF8F2] rounded-2xl p-4 border-2 border-[#6CB4E8]/20 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6CB4E8] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1A1A1A]">Interest Earned</p>
                <p className="text-sm text-[#6CB4E8] font-bold">+${yieldDollars.toFixed(6)}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
