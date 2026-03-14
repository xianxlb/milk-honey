'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Sparkles, Shield } from 'lucide-react'
import { usePrivy, useWallets as useConnectedWallets, getEmbeddedConnectedWallet } from '@privy-io/react-auth'
import { useWallets as useSolanaWallets, useSignTransaction } from '@privy-io/react-auth/solana'
import { Connection } from '@solana/web3.js'
import { ensureCity, deposit } from '@/lib/api'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = parseFloat(searchParams.get('amount') || '0')
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const { user } = usePrivy()
  const { wallets: connectedWallets } = useConnectedWallets()
  const embeddedWallet = getEmbeddedConnectedWallet(connectedWallets)
  const { wallets: solanaWallets } = useSolanaWallets()
  const { signTransaction } = useSignTransaction()

  // Find the Solana standard wallet matching the embedded wallet address for signing
  const solanaWallet = solanaWallets.find(w => w.address === embeddedWallet?.address) ?? solanaWallets[0]

  useEffect(() => {
    if (!amount || amount <= 0) {
      router.replace('/deposit')
    }
  }, [amount, router])

  const handleDeposit = async () => {
    if (!solanaWallet) {
      alert('Wallet not ready. Please wait a moment and try again.')
      return
    }

    setIsProcessing(true)
    setStatus('Preparing transaction...')

    try {
      // 1. Get gas-sponsored Jupiter Lend deposit tx from backend
      const prepareRes = await fetch('/api/deposit/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: solanaWallet.address,
          amountUSDC: amount,
        }),
      })

      if (!prepareRes.ok) {
        const err = await prepareRes.json()
        throw new Error(err.error || 'Failed to prepare transaction')
      }

      const { transaction: txBase64 } = await prepareRes.json()

      // 2. Deserialize and sign with user's Privy wallet
      setStatus('Please approve the transaction...')
      const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0))

      const { signedTransaction } = await signTransaction({
        transaction: txBytes,
        wallet: solanaWallet,
      })

      // 3. Submit to Solana
      setStatus('Submitting to Solana...')
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      const connection = new Connection(rpcUrl, 'confirmed')
      const signature = await connection.sendRawTransaction(signedTransaction)
      await connection.confirmTransaction(signature, 'confirmed')

      // 4. Record deposit in backend
      setStatus('Recording deposit...')
      const cityId = await ensureCity(solanaWallet.address)
      const result = await deposit(cityId, amount, signature)

      if (result.packs.length > 0) {
        const packIds = result.packs.map(p => p.id)
        sessionStorage.setItem('pending_packs', JSON.stringify(packIds))
        router.replace(`/open-pack?packId=${packIds[0]}`)
      } else {
        router.replace('/')
      }
    } catch (err) {
      console.error('Deposit failed:', err)
      alert(`Deposit failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsProcessing(false)
      setStatus('')
    }
  }

  const numPacks = Math.floor(amount / 100)
  const userEmail = user?.email?.address

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
            disabled={isProcessing}
          >
            <ArrowLeft className="w-5 h-5 text-[#1F2937]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1F2937]" style={{ fontFamily: 'Fredoka' }}>
              Deposit to Vault
            </h1>
            <p className="text-sm text-[#6B7280]">Jupiter Lend USDC Vault</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        {/* Amount Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-black/5 mb-8">
          <p className="text-[#6B7280] text-sm mb-2">Deposit Amount</p>
          <p className="text-4xl font-bold text-[#1F2937] mb-4" style={{ fontFamily: 'Fredoka' }}>
            ${amount.toFixed(2)} USDC
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

        {/* Wallet Info */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-black/5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#5B9BD5]/10 to-[#4A8BC2]/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-[#5B9BD5]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#1F2937]">Your Wallet</p>
              {userEmail && (
                <p className="text-sm text-[#6B7280]">{userEmail}</p>
              )}
              {solanaWallet && (
                <p className="text-xs text-[#9CA3AF] font-mono mt-1">
                  {solanaWallet.address.slice(0, 4)}...{solanaWallet.address.slice(-4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-[#10B981]/10 to-white rounded-2xl p-6 border border-[#10B981]/20 mb-6">
          <p className="text-sm text-[#6B7280]">
            <strong>Self-custodial:</strong> Your USDC is deposited directly into Jupiter Lend from your wallet. The vault position belongs to you. Gas fees are covered by us.
          </p>
        </div>

        {/* Processing Status */}
        {isProcessing && status && (
          <div className="bg-[#5B9BD5]/10 rounded-2xl p-4 border border-[#5B9BD5]/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#5B9BD5]/30 border-t-[#5B9BD5] rounded-full animate-spin" />
              <p className="text-sm text-[#5B9BD5] font-semibold">{status}</p>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Button */}
      <div className="bg-white border-t border-black/5 px-6 py-4">
        <button
          onClick={handleDeposit}
          disabled={!solanaWallet || isProcessing}
          className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-lg transition-all ${
            solanaWallet && !isProcessing
              ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:shadow-xl active:scale-95'
              : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : !solanaWallet ? (
            'Waiting for wallet...'
          ) : (
            `Deposit $${amount.toFixed(2)} to Jupiter Lend`
          )}
        </button>
      </div>
    </div>
  )
}

export default function PaymentOptionsPage() {
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
