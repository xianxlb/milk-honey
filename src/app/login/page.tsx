'use client'

import { useWeb3Auth } from '@/components/web3auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import bs58 from 'bs58'

export default function LoginPage() {
  const { ready, authenticated, loginWithGoogle, loginWithEmail, setWalletSession, getWcAdapter } = useWeb3Auth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<'google' | 'email' | 'wallet' | null>(null)

  useEffect(() => {
    if (ready && authenticated) router.replace('/')
  }, [ready, authenticated, router])

  const handleGoogle = async () => {
    setError(null)
    setLoading('google')
    try { await loginWithGoogle() } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(null)
    }
  }

  const handleEmail = async () => {
    if (!email) return
    setError(null)
    setLoading('email')
    try { await loginWithEmail(email) } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(null)
    }
  }

  const handleWallet = async () => {
    setError(null)
    setLoading('wallet')
    try {
      const wcAdapter = await getWcAdapter()
      // Race connect() against a 2-minute timeout. Without this, if
      // UniversalProvider.init() hangs (stale relay sessions), connect()
      // waits forever with no error — the spinner never clears.
      await Promise.race([
        wcAdapter.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out — please try again')), 120_000)
        ),
      ])

      const addr = wcAdapter.publicKey?.toBase58()
      if (!addr) throw new Error('No wallet address after connect')

      const challengeRes = await fetch(`/api/auth/challenge?wallet=${addr}`)
      if (!challengeRes.ok) throw new Error('Failed to get challenge')
      const { message } = await challengeRes.json()

      const msgBytes = new TextEncoder().encode(message)
      const sigBytes = await wcAdapter.signMessage(msgBytes)
      const signature = bs58.encode(sigBytes)

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, walletAddress: addr }),
      })
      if (!verifyRes.ok) throw new Error('Signature verification failed')
      const { sessionToken } = await verifyRes.json()
      setWalletSession(sessionToken, addr)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection failed')
      setLoading(null)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#F0C430]/40 border-t-[#F0C430] rounded-full animate-spin" />
      </div>
    )
  }

  const busy = loading !== null

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col" style={{
      background: 'radial-gradient(ellipse 120% 60% at 50% 0%, #FDE98A 0%, #F5F0E8 55%)',
    }}>
      {/* Hero */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6 flex-1 justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#F0C430]/30 blur-2xl scale-150" />
          <img src="/mascot.png" alt="Milk & Honey" className="relative w-28 h-28 drop-shadow-lg" />
        </div>
        <div className="text-center">
          <h1
            className="text-4xl font-bold text-[#1A1A1A] tracking-tight"
            style={{ fontFamily: 'Fredoka' }}
          >
            Milk & Honey
          </h1>
          <p className="text-[#1A1A1A]/50 mt-1 font-medium text-base">
            Gather your crew. Earn real yield.
          </p>
        </div>
      </div>

      {/* Login card */}
      <div className="bg-white/70 backdrop-blur-sm rounded-t-[2.5rem] px-6 pt-8 pb-10 shadow-[0_-4px_40px_rgba(0,0,0,0.06)] flex flex-col gap-4">

        {/* Primary: Google */}
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full bg-[#F0C430] text-[#1A1A1A] py-4 px-5 rounded-2xl font-bold text-base shadow-md border-2 border-[#1A1A1A]/8 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-3"
        >
          <span className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <GoogleIcon />
          </span>
          <span className="flex-1 text-center pr-8">
            {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-[#1A1A1A]/8" />
          <span className="text-xs text-[#1A1A1A]/30 font-semibold tracking-wide uppercase">or</span>
          <div className="flex-1 h-px bg-[#1A1A1A]/8" />
        </div>

        {/* Secondary: Email */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={busy}
              onKeyDown={e => e.key === 'Enter' && handleEmail()}
              className="flex-1 bg-[#F5F0E8] border-2 border-[#1A1A1A]/8 rounded-2xl px-4 py-3 text-[#1A1A1A] text-sm font-medium outline-none focus:border-[#F0C430]/70 transition-colors placeholder:text-[#1A1A1A]/30 disabled:opacity-50"
            />
            <button
              onClick={handleEmail}
              disabled={busy || !email}
              className="bg-[#F5F0E8] border-2 border-[#1A1A1A]/8 text-[#1A1A1A]/70 px-4 rounded-2xl font-bold text-sm hover:border-[#F0C430]/60 hover:text-[#1A1A1A] active:scale-95 transition-all disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              {loading === 'email' ? '…' : 'Send link'}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center font-medium">{error}</p>
        )}

        {/* Tertiary: Wallet */}
        <button
          onClick={handleWallet}
          disabled={busy}
          className="w-full text-[#1A1A1A]/40 text-sm font-medium py-2 hover:text-[#1A1A1A]/70 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <WalletIcon />
          {loading === 'wallet' ? 'Connecting…' : 'Connect a wallet'}
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.5-2.8-11.3-7l-6.6 5.1C9.7 39.8 16.4 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.6-2.6 4.7-4.8 6.2l6.2 5.2C40.3 36 44 30.4 44 24c0-1.3-.1-2.7-.4-4z"/>
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M16 12h2"/>
      <path d="M2 10h20"/>
    </svg>
  )
}
