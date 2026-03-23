'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useWeb3Auth } from '@/components/web3auth-provider'

type Card = { id: string; animal_type: string; level: number }
type Pack = { id: string; wallet_address: string; deposit_id: string; card_id: string | null; created_at: string; opened_at: string | null }
type PendingWithdrawal = { id: string; amount_usdc: number; cooldown_seconds: number; initiated_at: string }

export type Portfolio = {
  cards: Card[]
  packs: Pack[]
  lastDepositAt: string | null
  stats: {
    totalDepositedUsdc: number
    yieldEarnedUsdc: number
    apyPercent: number
    cardCount: number
    unopenedPackCount: number
  }
}

type PortfolioContextValue = {
  portfolio: Portfolio | null
  pendingWithdrawal: PendingWithdrawal | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  getToken: () => Promise<string | null>
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, getAccessToken } = useWeb3Auth()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [pendingWithdrawal, setPendingWithdrawal] = useState<PendingWithdrawal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Token cache — skip getAccessToken() if we already have a fresh one
  const tokenRef = useRef<string | null>(null)
  const tokenExpiryRef = useRef<number>(0)

  const getToken = useCallback(async (): Promise<string | null> => {
    if (tokenRef.current && Date.now() < tokenExpiryRef.current - 30_000) {
      return tokenRef.current
    }
    const token = await getAccessToken()
    if (token) {
      tokenRef.current = token
      tokenExpiryRef.current = Date.now() + 55 * 60 * 1000 // 55 min conservative TTL
    }
    return token
  }, [getAccessToken])

  const refresh = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    // Retry once (2 s delay) before surfacing an error — handles transient
    // network hiccups that would otherwise block the whole home screen.
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000))
      try {
        const res = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`${res.status}`)
        const data = await res.json()
        setPortfolio(data.portfolio)
        setPendingWithdrawal(data.pendingWithdrawal)
        setError(null)
        setLoading(false)
        return
      } catch (err) {
        if (attempt === 0) continue
        setError((err as Error).message ?? 'Failed to load')
      }
    }
    setLoading(false)
  }, [getToken])

  useEffect(() => {
    if (!authenticated) return
    refresh()
  }, [authenticated, refresh])

  // Refresh on window focus
  useEffect(() => {
    if (!authenticated) return
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [authenticated, refresh])

  return (
    <PortfolioContext.Provider value={{ portfolio, pendingWithdrawal, loading: !ready || loading, error, refresh, getToken }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider')
  return ctx
}
