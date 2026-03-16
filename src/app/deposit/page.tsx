'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { usePrivy, type WalletWithMetadata } from '@privy-io/react-auth'
import { useAuth } from '@/hooks/use-auth'
import { getDepositTx, verifyDeposit } from '@/lib/client-api'
import { MIN_DEPOSIT } from '@/lib/constants'
import { useWallets, useSignAndSendTransaction } from '@privy-io/react-auth/solana'
import bs58 from 'bs58'

export default function DepositPage() {
  const router = useRouter()
  const { user } = usePrivy()
  const { ready, getAccessToken } = useAuth()
  const { wallets } = useWallets()
  const { signAndSendTransaction } = useSignAndSendTransaction()
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'building-tx' | 'signing' | 'verifying' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!ready) return <div className="min-h-screen bg-[#F5F0E8]" />

  const numPacks = Math.floor(parseFloat(amount || '0') / 100)

  const handleDeposit = async () => {
    const dollars = parseFloat(amount)
    if (!dollars || dollars < MIN_DEPOSIT) {
      setErrorMsg(`Minimum deposit is $${MIN_DEPOSIT} USDC`)
      return
    }
    const amountUsdc = Math.floor(dollars * 1_000_000)
    setErrorMsg(null)

    try {
      // Step 1: Get serialized tx from our backend (calls Lulo API server-side)
      setStatus('building-tx')
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      const { transaction: txBase64 } = await getDepositTx(token, amountUsdc)

      // Step 2: Sign and send — prefer external wallet (e.g. Jupiter Mobile) over embedded
      setStatus('signing')
      const embeddedAddress = (user?.linkedAccounts as WalletWithMetadata[] | undefined)
        ?.find(a => a.type === 'wallet' && a.walletClientType === 'privy' && a.chainType === 'solana')
        ?.address
      const wallet = wallets.find(w => w.address !== embeddedAddress) ?? wallets[0]
      if (!wallet) throw new Error('No Solana wallet connected')

      const txBytes = new Uint8Array(Buffer.from(txBase64, 'base64'))
      const output = await signAndSendTransaction({
        transaction: txBytes,
        wallet,
        options: { commitment: 'confirmed' },
      })
      const txSignature = bs58.encode(output.signature)

      // Step 3: Verify on our backend → credit packs
      setStatus('verifying')
      const result = await verifyDeposit(token, txSignature, amountUsdc)

      // Step 4: Navigate to pack opening
      setStatus('done')
      if (result.packs?.length > 0) {
        const packIds = result.packs.map((p: { id: string }) => p.id)
        sessionStorage.setItem('pending_packs', JSON.stringify(packIds))
        router.replace(`/open-pack?packId=${packIds[0]}`)
      } else {
        router.replace('/')
      }
    } catch (err: unknown) {
      console.error('Deposit failed:', err)
      const errStatus = (err as { status?: number }).status
      if (errStatus === 409) {
        // tx already processed — navigate home, packs may already be credited
        setErrorMsg('This transaction was already processed. Check your packs!')
        setTimeout(() => router.replace('/'), 2000)
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Deposit failed. Please try again.')
        setStatus('error')
      }
    }
  }

  const isProcessing = ['building-tx', 'signing', 'verifying'].includes(status)
  const statusLabel: Record<string, string> = {
    'building-tx': 'Preparing transaction...',
    signing: 'Waiting for wallet signature...',
    verifying: 'Confirming on-chain...',
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      <header className="bg-[#FBF8F2] border-b-2 border-[#1A1A1A]/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} disabled={isProcessing}
            className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center border-2 border-[#1A1A1A]/8">
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Deposit USDC</h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">Earn real yield with Lulo</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="bg-[#FBF8F2] rounded-3xl p-6 shadow-lg border-2 border-[#1A1A1A]/8 mb-8">
          <p className="text-[#1A1A1A]/50 text-sm mb-2 font-medium">Amount (USD)</p>
          <input
            type="number" min={MIN_DEPOSIT} step="1" value={amount}
            onChange={(e) => setAmount(e.target.value)} disabled={isProcessing}
            placeholder="100"
            className="w-full text-4xl font-bold text-[#1A1A1A] bg-transparent outline-none mb-4"
            style={{ fontFamily: 'Fredoka' }}
          />
          {numPacks > 0 && (
            <div className="bg-[#F0C430]/20 rounded-2xl p-4 border-2 border-[#F0C430]/30 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">🎁</span>
              <p className="text-sm text-[#1A1A1A] font-semibold">
                You&apos;ll unlock {numPacks} new building{numPacks > 1 ? 's' : ''}!
              </p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="bg-[#FEE2E2] rounded-2xl p-4 border-2 border-[#DC2626]/20 mb-6">
            <p className="text-[#DC2626] text-sm font-medium">{errorMsg}</p>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 bg-[#FBF8F2] border-t-2 border-[#1A1A1A]/5 px-6 py-4">
        <button onClick={handleDeposit} disabled={!amount || isProcessing}
          className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all border-2 ${
            amount && !isProcessing
              ? 'bg-[#F0C430] text-[#1A1A1A] border-[#1A1A1A]/10 hover:shadow-xl active:scale-95'
              : 'bg-[#EDE8DC] text-[#1A1A1A]/30 border-[#1A1A1A]/5 cursor-not-allowed'
          }`}>
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin" />
              {statusLabel[status] ?? 'Processing...'}
            </span>
          ) : (
            `Deposit${amount ? ` $${parseFloat(amount).toFixed(2)}` : ''}`
          )}
        </button>
      </div>
    </div>
  )
}
