'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Wallet, Sparkles, Shield, Zap } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { useGaslessDeposit } from '@/hooks/useGaslessDeposit'
import { setCityId } from '@/lib/api'

// Default vault destination — in production, yield-router picks the best one
const DEFAULT_VAULT = process.env.NEXT_PUBLIC_VOLTR_VAULT_ADDRESS || process.env.NEXT_PUBLIC_WALLET_ADDRESS || ''

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = parseFloat(searchParams.get('amount') || '0')
  const { login, authenticated, user } = usePrivy()
  const { deposit, isDepositing, error: depositError } = useGaslessDeposit()
  const [status, setStatus] = useState<'idle' | 'signing' | 'relaying' | 'done'>('idle')

  useEffect(() => {
    if (!amount || amount <= 0) {
      router.replace('/deposit')
    }
  }, [amount, router])

  const handleDeposit = async () => {
    if (!authenticated) {
      login()
      return
    }

    try {
      setStatus('signing')
      const result = await deposit(amount, DEFAULT_VAULT)
      setStatus('done')

      // Link city to local storage for existing flows
      setCityId(result.cityId)

      if (result.packs.length > 0) {
        const packIds = result.packs.map(p => p.id)
        sessionStorage.setItem('pending_packs', JSON.stringify(packIds))
        router.replace(`/open-pack?packId=${packIds[0]}`)
      } else {
        router.replace('/')
      }
    } catch (err) {
      console.error('Deposit failed:', err)
      setStatus('idle')
    }
  }

  const numPacks = Math.floor(amount / 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
            disabled={isDepositing}
          >
            <ArrowLeft className="w-5 h-5 text-[#1F2937]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1F2937]" style={{ fontFamily: 'Fredoka' }}>
              Deposit USDC
            </h1>
            <p className="text-sm text-[#6B7280]">Gas-free deposit from your wallet</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        {/* Amount Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-black/5 mb-8">
          <p className="text-[#6B7280] text-sm mb-2">Deposit Amount</p>
          <p className="text-4xl font-bold text-[#1F2937] mb-4" style={{ fontFamily: 'Fredoka' }}>
            ${amount.toFixed(2)} <span className="text-lg font-normal text-[#6B7280]">USDC</span>
          </p>

          {numPacks > 0 && (
            <div className="bg-gradient-to-r from-[#FFA94D]/10 to-[#FF9529]/10 rounded-2xl p-4 border border-[#FFA94D]/20 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[#FFA94D] flex-shrink-0" />
              <p className="text-sm text-[#1F2937] font-semibold">
                You&apos;ll unlock {numPacks} new building{numPacks > 1 ? 's' : ''}!
              </p>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4" style={{ fontFamily: 'Fredoka' }}>
            How It Works
          </h2>
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-5 border border-black/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5B9BD5]/10 to-[#5B9BD5]/5 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-[#5B9BD5]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1F2937]">Your wallet, your keys</p>
                <p className="text-sm text-[#6B7280]">USDC moves from your wallet to the yield vault</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-black/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981]/10 to-[#10B981]/5 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#10B981]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1F2937]">Zero gas fees for you</p>
                <p className="text-sm text-[#6B7280]">We pay the Solana transaction fees</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-black/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED]/10 to-[#7C3AED]/5 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#7C3AED]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1F2937]">Self-custodial</p>
                <p className="text-sm text-[#6B7280]">We never have access to your funds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {authenticated && user && (
          <div className="bg-gradient-to-br from-[#10B981]/10 to-white rounded-2xl p-6 border border-[#10B981]/20 mb-8">
            <p className="text-sm text-[#6B7280]">
              <strong>Logged in as:</strong> {user.email?.address || user.google?.email || 'Connected'}
            </p>
          </div>
        )}

        {/* Error Display */}
        {depositError && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200 mb-8">
            <p className="text-sm text-red-600 font-medium">{depositError}</p>
          </div>
        )}
      </main>

      {/* Fixed Bottom Button */}
      <div className="bg-white border-t border-black/5 px-6 py-4">
        <button
          onClick={handleDeposit}
          disabled={isDepositing}
          className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-lg transition-all ${
            !isDepositing
              ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:shadow-xl active:scale-95'
              : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
          }`}
        >
          {!authenticated ? (
            'Sign in to Deposit'
          ) : isDepositing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {status === 'signing' ? 'Signing transaction...' : 'Submitting to Solana...'}
            </span>
          ) : (
            `Deposit $${amount.toFixed(2)} USDC`
          )}
        </button>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#5B9BD5]/30 border-t-[#5B9BD5] rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
