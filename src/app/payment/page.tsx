'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CreditCard, Smartphone, Building2, Wallet } from 'lucide-react'
import { ensureCity, deposit } from '@/lib/api'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = parseFloat(searchParams.get('amount') || '0')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!amount || amount <= 0) router.replace('/deposit')
  }, [amount, router])

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
    { id: 'ewallet', name: 'E-Wallet', icon: Smartphone, desc: 'GrabPay, PayNow, TouchNGo' },
    { id: 'bank', name: 'Bank Transfer', icon: Building2, desc: 'Direct bank transfer' },
    { id: 'crypto', name: 'Crypto Wallet', icon: Wallet, desc: 'USDT, BTC, ETH' },
  ]

  const handlePayment = async () => {
    if (!selectedMethod) return
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const cityId = await ensureCity()
      const result = await deposit(cityId, amount)
      if (result.packs.length > 0) {
        const packIds = result.packs.map(p => p.id)
        sessionStorage.setItem('pending_packs', JSON.stringify(packIds))
        router.replace(`/open-pack?packId=${packIds[0]}`)
      } else {
        router.replace('/')
      }
    } catch (err) {
      console.error('Deposit failed:', err)
      alert('Deposit failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const numPacks = Math.floor(amount / 100)

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      <header className="bg-[#FBF8F2] border-b-2 border-[#1A1A1A]/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center hover:bg-[#EDE8DC] transition-colors border-2 border-[#1A1A1A]/8" disabled={isProcessing}>
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Payment Method</h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">Choose how to deposit</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="bg-[#FBF8F2] rounded-3xl p-6 shadow-lg border-2 border-[#1A1A1A]/8 mb-8">
          <p className="text-[#1A1A1A]/50 text-sm mb-2 font-medium">Deposit Amount</p>
          <p className="text-4xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: 'Fredoka' }}>${amount.toFixed(2)}</p>
          {numPacks > 0 && (
            <div className="bg-[#F0C430]/20 rounded-2xl p-4 border-2 border-[#F0C430]/30 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">🎁</span>
              <p className="text-sm text-[#1A1A1A] font-semibold">You&apos;ll unlock {numPacks} new building{numPacks > 1 ? 's' : ''}!</p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: 'Fredoka' }}>Select Payment Method</h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = selectedMethod === method.id
              return (
                <button
                  key={method.id} onClick={() => setSelectedMethod(method.id)} disabled={isProcessing}
                  className={`w-full p-5 rounded-2xl transition-all border-2 ${
                    isSelected ? 'bg-[#6CB4E8] shadow-lg scale-[1.02] border-[#1A1A1A]/10' : 'bg-[#FBF8F2] border-[#1A1A1A]/8 hover:border-[#6CB4E8]'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/25 border-2 border-white/30' : 'bg-[#F5F0E8] border-2 border-[#1A1A1A]/5'}`}>
                      <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-semibold ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`}>{method.name}</p>
                      <p className={`text-sm ${isSelected ? 'text-white/70' : 'text-[#1A1A1A]/50'}`}>{method.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-[#6CB4E8] rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 bg-[#FBF8F2] border-t-2 border-[#1A1A1A]/5 px-6 py-4">
        <button
          onClick={handlePayment} disabled={!selectedMethod || isProcessing}
          className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all border-2 ${
            selectedMethod && !isProcessing
              ? 'bg-[#F0C430] text-[#1A1A1A] border-[#1A1A1A]/10 hover:shadow-xl active:scale-95'
              : 'bg-[#EDE8DC] text-[#1A1A1A]/30 border-[#1A1A1A]/5 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `Confirm Payment - $${amount.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  )
}

export default function PaymentOptionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6CB4E8]/30 border-t-[#6CB4E8] rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
