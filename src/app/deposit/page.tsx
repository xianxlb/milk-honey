'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign } from 'lucide-react'

export default function DepositAmountPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const quickAmounts = [10, 25, 50, 100, 250, 500]

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
    setShowCustom(false)
    setCustomAmount('')
  }

  const handleCustomAmount = () => {
    setShowCustom(true)
    setAmount('')
  }

  const handleContinue = () => {
    const finalAmount = showCustom ? parseFloat(customAmount) : parseFloat(amount)

    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    router.push(`/payment?amount=${finalAmount}`)
  }

  const selectedAmount = showCustom ? parseFloat(customAmount) : parseFloat(amount)
  const isValid = !isNaN(selectedAmount) && selectedAmount > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#1F2937]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1F2937]" style={{ fontFamily: 'Fredoka' }}>
              Deposit Amount
            </h1>
            <p className="text-sm text-[#6B7280]">How much would you like to save?</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        {/* Amount Display */}
        <div className="bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] rounded-3xl p-8 mb-8 shadow-xl">
          <p className="text-white/80 text-sm mb-2 text-center">Amount to Deposit</p>
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="w-8 h-8 text-white" />
            <p className="text-6xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              {showCustom
                ? (customAmount || '0')
                : (amount || '0')
              }
            </p>
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4" style={{ fontFamily: 'Fredoka' }}>
            Quick Amounts
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {quickAmounts.map((value) => (
              <button
                key={value}
                onClick={() => handleQuickAmount(value)}
                className={`py-4 px-4 rounded-2xl font-semibold transition-all ${
                  amount === value.toString() && !showCustom
                    ? 'bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] text-white shadow-lg scale-105'
                    : 'bg-white border-2 border-[#E5E7EB] text-[#1F2937] hover:border-[#5B9BD5]'
                }`}
              >
                ${value}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4" style={{ fontFamily: 'Fredoka' }}>
            Custom Amount
          </h2>
          <button
            onClick={handleCustomAmount}
            className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all mb-4 ${
              showCustom
                ? 'bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] text-white shadow-lg'
                : 'bg-white border-2 border-[#E5E7EB] text-[#1F2937] hover:border-[#5B9BD5]'
            }`}
          >
            Enter Custom Amount
          </button>

          {showCustom && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-black/5">
              <label className="block text-sm font-semibold text-[#1F2937] mb-2">
                Enter Amount ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl text-2xl font-bold text-[#1F2937] focus:border-[#5B9BD5] focus:outline-none transition-colors"
                  autoFocus
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-[#FFA94D]/10 to-white rounded-2xl p-6 border border-[#FFA94D]/20">
          <p className="text-sm text-[#6B7280]">
            <strong>Tip:</strong> Deposit $100 or more to unlock a new building for your village!
          </p>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="bg-white border-t border-black/5 px-6 py-4">
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-lg transition-all ${
            isValid
              ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:shadow-xl active:scale-95'
              : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
          }`}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}
