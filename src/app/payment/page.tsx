'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CreditCard, Smartphone, Building2, Wallet, Sparkles } from 'lucide-react'
import { ensureCity, deposit } from '@/lib/api'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = parseFloat(searchParams.get('amount') || '0')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!amount || amount <= 0) {
      router.replace('/deposit')
    }
  }, [amount, router])

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, color: '#5B9BD5', desc: 'Visa, Mastercard, Amex' },
    { id: 'ewallet', name: 'E-Wallet', icon: Smartphone, color: '#FFA94D', desc: 'GrabPay, PayNow, TouchNGo' },
    { id: 'bank', name: 'Bank Transfer', icon: Building2, color: '#7C3AED', desc: 'Direct bank transfer' },
    { id: 'crypto', name: 'Crypto Wallet', icon: Wallet, color: '#10B981', desc: 'USDT, BTC, ETH' },
  ]

  const handlePayment = async () => {
    if (!selectedMethod) return

    setIsProcessing(true)

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const cityId = await ensureCity()
      const result = await deposit(cityId, amount)

      if (result.packs.length > 0) {
        // Store pack IDs for sequential opening
        const packIds = result.packs.map(p => p.id)
        sessionStorage.setItem('pending_packs', JSON.stringify(packIds))
        router.replace(`/open-pack?packId=${packIds[0]}`)
      } else {
        // No packs earned (deposit < $100), go home
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
              Payment Method
            </h1>
            <p className="text-sm text-[#6B7280]">Choose how to deposit</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        {/* Amount Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-black/5 mb-8">
          <p className="text-[#6B7280] text-sm mb-2">Deposit Amount</p>
          <p className="text-4xl font-bold text-[#1F2937] mb-4" style={{ fontFamily: 'Fredoka' }}>
            ${amount.toFixed(2)}
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

        {/* Payment Methods */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4" style={{ fontFamily: 'Fredoka' }}>
            Select Payment Method
          </h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = selectedMethod === method.id

              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={isProcessing}
                  className={`w-full p-5 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] shadow-lg scale-[1.02]'
                      : 'bg-white border-2 border-[#E5E7EB] hover:border-[#5B9BD5]'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-white/20 border border-white/30'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-[#1F2937]'}`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-semibold ${isSelected ? 'text-white' : 'text-[#1F2937]'}`}>
                        {method.name}
                      </p>
                      <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-[#6B7280]'}`}>
                        {method.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-[#5B9BD5] rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-gradient-to-br from-[#10B981]/10 to-white rounded-2xl p-6 border border-[#10B981]/20">
          <p className="text-sm text-[#6B7280]">
            <strong>Secure Payment:</strong> Your payment information is encrypted and secure. We never store your card details.
          </p>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="bg-white border-t border-black/5 px-6 py-4">
        <button
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing}
          className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-lg transition-all ${
            selectedMethod && !isProcessing
              ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:shadow-xl active:scale-95'
              : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#5B9BD5]/30 border-t-[#5B9BD5] rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
