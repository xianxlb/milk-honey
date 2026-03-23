'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { BottomNav } from '@/components/bottom-nav'
import { getDepositTx } from '@/lib/client-api'
import { MIN_DEPOSIT } from '@/lib/constants'
import { useTransactionSender } from '@/hooks/use-transaction-sender'


export default function DepositPage() {
  const router = useRouter()
  const { ready, getAccessToken } = useAuth()
  const { sendTx } = useTransactionSender()
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'building-tx' | 'signing' | 'verifying' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!ready) return <div className="min-h-screen bg-[#F5F0E8]" />

  const numPacks = Math.floor(parseFloat(amount || '0') / 20)

  const handleDeposit = async () => {
    const dollars = parseFloat(amount)
    if (!dollars || dollars < MIN_DEPOSIT) {
      setErrorMsg(`Minimum deposit is $${MIN_DEPOSIT}`)
      return
    }
    const amountUsdc = Math.floor(dollars * 1_000_000)
    setErrorMsg(null)

    let txSignature: string | undefined
    try {
      setStatus('building-tx')
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      const { transaction: txBase64 } = await getDepositTx(token, amountUsdc)

      setStatus('signing')
      txSignature = await sendTx(txBase64)

      sessionStorage.setItem('pending_verification', JSON.stringify({ txSignature, amountUsdc }))
      setStatus('done')
      router.replace('/')
    } catch (err: unknown) {
      console.error('Deposit failed:', err)
      if (txSignature) {
        sessionStorage.setItem('pending_verification', JSON.stringify({ txSignature, amountUsdc }))
        router.replace('/')
      } else {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'Not authenticated') {
          setErrorMsg('Please sign in and try again.')
        } else {
          setErrorMsg(msg || 'Something went wrong. Please try again.')
        }
        setStatus('error')
      }
    }
  }

  const isProcessing = ['building-tx', 'signing'].includes(status)
  const statusLabel: Record<string, string> = {
    'building-tx': 'Getting things ready...',
    signing: 'Waiting for your approval...',
    verifying: 'Your crew is on the way...',
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col pb-20">
      <header className="bg-[#FBF8F2] border-b-2 border-[#1A1A1A]/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} disabled={isProcessing}
            className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center border-2 border-[#1A1A1A]/8">
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Add Money</h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">Earn interest on your savings</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="bg-[#FBF8F2] rounded-3xl p-6 shadow-lg border-2 border-[#1A1A1A]/8 mb-8">
          <p className="text-[#1A1A1A]/50 text-sm mb-2 font-medium">Amount (USD)</p>
          <input
            type="number" min={MIN_DEPOSIT} step="1" value={amount}
            onChange={(e) => setAmount(e.target.value)} disabled={isProcessing}
            placeholder="20"
            className="w-full text-4xl font-bold text-[#1A1A1A] bg-transparent outline-none mb-4"
            style={{ fontFamily: 'Fredoka' }}
          />
          <div className="flex gap-2 mb-4">
            {[20, 50, 100].map((preset) => (
              <button key={preset} onClick={() => setAmount(String(preset))} disabled={isProcessing}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  amount === String(preset)
                    ? 'bg-[#F0C430] border-[#F0C430] text-[#1A1A1A]'
                    : 'bg-[#F5F0E8] border-[#1A1A1A]/10 text-[#1A1A1A]/60 hover:border-[#F0C430]/60'
                }`}>
                ${preset}
              </button>
            ))}
          </div>
          {numPacks > 0 && (
            <div className="bg-[#F0C430]/20 rounded-2xl p-4 border-2 border-[#F0C430]/30 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">🎁</span>
              <p className="text-sm text-[#1A1A1A] font-semibold">
                You&apos;ll get {numPacks} new crew member{numPacks > 1 ? 's' : ''}!
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

      <div className="sticky bottom-16 bg-[#FBF8F2] border-t-2 border-[#1A1A1A]/5 px-6 py-4">
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
      <BottomNav />
    </div>
  )
}
