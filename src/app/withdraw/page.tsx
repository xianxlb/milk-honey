'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { usePortfolio } from '@/contexts/portfolio-context'
import { useTransactionSender } from '@/hooks/use-transaction-sender'
import { getWithdrawTx, recordWithdrawInitiate } from '@/lib/client-api'
import { BottomNav } from '@/components/bottom-nav'
import { ANIMAL_PRODUCE, type AnimalType } from '@/lib/animals'
import { getAnimalEmoji } from '@/lib/animal-images'

type Card = { id: string; animal_type: string; level: number }

export default function WithdrawPage() {
  const router = useRouter()
  const { portfolio, pendingWithdrawal, loading, getToken } = usePortfolio()
  const { sendTx } = useTransactionSender()

  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'building-tx' | 'signing' | 'recording' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const stats = portfolio?.stats
  const cards: Card[] = (portfolio?.cards ?? []) as Card[]
  const positionDollars = stats ? (stats.totalDepositedUsdc + stats.yieldEarnedUsdc) / 1_000_000 : 0
  const hasPending = !!pendingWithdrawal

  if (loading && !portfolio) return <div className="min-h-screen bg-[#F5F0E8]" />

  const dollars = parseFloat(amount || '0')
  const amountUsdc = Math.floor(dollars * 1_000_000)
  const isProcessing = ['building-tx', 'signing', 'recording'].includes(status)
  const canWithdraw = !!amount && dollars > 0 && dollars <= positionDollars && !hasPending && !isProcessing

  // Which animals contribute to this harvest (one per $20, lowest level first)
  const contributingCount = Math.min(cards.length, Math.floor(dollars / 20))
  const contributors = cards
    .slice()
    .sort((a, b) => a.level - b.level)
    .slice(0, contributingCount)

  const statusLabel: Record<string, string> = {
    'building-tx': 'Getting things ready...',
    signing: 'Waiting for your approval...',
    recording: 'Saving your withdrawal...',
  }

  const handleWithdraw = async () => {
    if (!canWithdraw) return
    setErrorMsg(null)

    let txSignature: string | undefined
    try {
      setStatus('building-tx')
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const { transaction: txBase64 } = await getWithdrawTx(token, 'initiate', amountUsdc)

      setStatus('signing')
      txSignature = await sendTx(txBase64)

      setStatus('recording')
      await recordWithdrawInitiate(token, txSignature, amountUsdc)

      setStatus('done')
      router.replace('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'Not authenticated') {
        setErrorMsg('Please sign in and try again.')
      } else if (msg.includes('wallet')) {
        setErrorMsg('Something went wrong. Please try again.')
      } else {
        setErrorMsg('Something went wrong. Please try again.')
      }
      setStatus('error')
    }
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
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Harvest</h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">
              Balance: ${positionDollars.toFixed(2)}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        {hasPending && (
          <div className="bg-[#FEF9E7] rounded-2xl p-4 border-2 border-[#F0C430]/40 mb-6">
            <p className="font-bold text-[#1A1A1A] text-sm">Harvest already in progress</p>
            <p className="text-xs text-[#1A1A1A]/50 mt-0.5">Go to Home to collect when it&apos;s ready.</p>
          </div>
        )}

        <div className="bg-[#FBF8F2] rounded-3xl p-6 shadow-lg border-2 border-[#1A1A1A]/8 mb-6">
          <p className="text-[#1A1A1A]/50 text-sm mb-2 font-medium">Amount (USD)</p>
          <input
            type="number" min="1" step="1" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing || hasPending}
            placeholder="0"
            className="w-full text-4xl font-bold text-[#1A1A1A] bg-transparent outline-none mb-4"
            style={{ fontFamily: 'Fredoka' }}
          />
          <div className="flex gap-2">
            {([
              { label: '20%', value: Math.floor(positionDollars * 0.2 * 100) / 100 },
              { label: '50%', value: Math.floor(positionDollars * 0.5 * 100) / 100 },
              { label: 'All',  value: Math.floor(positionDollars * 100) / 100 },
            ]).map(({ label, value }) => {
              const str = String(value)
              return (
                <button key={label} onClick={() => setAmount(str)}
                  disabled={isProcessing || hasPending || value <= 0}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                    amount === str
                      ? 'bg-[#F0C430] border-[#F0C430] text-[#1A1A1A]'
                      : value <= 0
                      ? 'bg-[#EDE8DC] border-[#1A1A1A]/5 text-[#1A1A1A]/20 cursor-not-allowed'
                      : 'bg-[#F5F0E8] border-[#1A1A1A]/10 text-[#1A1A1A]/60 hover:border-[#F0C430]/60'
                  }`}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Harvest preview */}
        {dollars > 0 && dollars <= positionDollars && (
          <div className="bg-[#FBF8F2] rounded-2xl border-2 border-[#1A1A1A]/8 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-[#1A1A1A]/5">
              <p className="font-bold text-[#1A1A1A] text-sm">Your crew pitches in 🌾</p>
            </div>
            {contributors.length > 0 ? (
              <div className="divide-y divide-[#1A1A1A]/5">
                {contributors.map((card) => {
                  const produce = ANIMAL_PRODUCE[card.animal_type as AnimalType]
                  return (
                    <div key={card.id} className="px-4 py-3 flex items-center gap-3">
                      <span className="text-2xl">{getAnimalEmoji(card.animal_type)}</span>
                      <p className="text-sm text-[#1A1A1A] font-medium flex-1">
                        <span className="font-semibold">{card.animal_type.charAt(0).toUpperCase() + card.animal_type.slice(1)}</span>
                        {' '}{produce.verb} {produce.item}
                      </p>
                      <span className="text-xl">{produce.emoji}</span>
                    </div>
                  )
                })}
                {dollars % 20 > 0 && (
                  <div className="px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <p className="text-sm text-[#1A1A1A]/50 font-medium flex-1">
                      + a little extra from the yield
                    </p>
                    <span className="text-sm font-bold text-[#6CB4E8]">
                      ${(dollars % 20).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-4 text-center">
                <p className="text-sm text-[#1A1A1A]/40 font-medium">
                  Deposit $20 to grow your first crew member — they&apos;ll produce for you!
                </p>
              </div>
            )}
          </div>
        )}

        {dollars > positionDollars && dollars > 0 && (
          <div className="bg-[#FEE2E2] rounded-2xl p-4 border-2 border-[#DC2626]/20 mb-6">
            <p className="text-[#DC2626] text-sm font-medium">Amount exceeds your balance of ${positionDollars.toFixed(2)}</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-[#FEE2E2] rounded-2xl p-4 border-2 border-[#DC2626]/20 mb-6">
            <p className="text-[#DC2626] text-sm font-medium">{errorMsg}</p>
          </div>
        )}
      </main>

      <div className="sticky bottom-16 bg-[#FBF8F2] border-t-2 border-[#1A1A1A]/5 px-6 py-4">
        <button onClick={handleWithdraw} disabled={!canWithdraw}
          className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all border-2 ${
            canWithdraw
              ? 'bg-[#F0C430] text-[#1A1A1A] border-[#1A1A1A]/10 hover:shadow-xl active:scale-95'
              : 'bg-[#EDE8DC] text-[#1A1A1A]/30 border-[#1A1A1A]/5 cursor-not-allowed'
          }`}>
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin" />
              {statusLabel[status] ?? 'Processing...'}
            </span>
          ) : hasPending ? (
            'Harvest in progress'
          ) : (
            `Harvest${amount && dollars > 0 ? ` $${dollars.toFixed(2)}` : ''}`
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
