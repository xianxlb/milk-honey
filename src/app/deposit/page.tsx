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
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      <header className="bg-[#FBF8F2] border-b-2 border-[#1A1A1A]/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center hover:bg-[#EDE8DC] transition-colors border-2 border-[#1A1A1A]/8">
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Deposit Amount</h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">How much would you like to save?</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="bg-[#6CB4E8] rounded-3xl p-8 mb-8 shadow-lg relative overflow-hidden border-2 border-[#1A1A1A]/10">
          <div className="absolute top-2 right-8 w-16 h-8 bg-white/20 rounded-full" />
          <p className="text-white/70 text-sm mb-2 text-center font-medium relative z-10">Amount to Deposit</p>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <DollarSign className="w-8 h-8 text-white/80" />
            <p className="text-6xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              {showCustom ? (customAmount || '0') : (amount || '0')}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: 'Fredoka' }}>Quick Amounts</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickAmounts.map((value) => (
              <button
                key={value}
                onClick={() => handleQuickAmount(value)}
                className={`py-4 px-4 rounded-2xl font-semibold transition-all border-2 ${
                  amount === value.toString() && !showCustom
                    ? 'bg-[#6CB4E8] text-white shadow-lg scale-105 border-[#1A1A1A]/10'
                    : 'bg-[#FBF8F2] border-[#1A1A1A]/8 text-[#1A1A1A] hover:border-[#6CB4E8]'
                }`}
              >
                ${value}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: 'Fredoka' }}>Custom Amount</h2>
          <button
            onClick={handleCustomAmount}
            className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all mb-4 border-2 ${
              showCustom
                ? 'bg-[#6CB4E8] text-white shadow-lg border-[#1A1A1A]/10'
                : 'bg-[#FBF8F2] border-[#1A1A1A]/8 text-[#1A1A1A] hover:border-[#6CB4E8]'
            }`}
          >
            Enter Custom Amount
          </button>

          {showCustom && (
            <div className="bg-[#FBF8F2] rounded-2xl p-6 shadow-lg border-2 border-[#1A1A1A]/8">
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">Enter Amount ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/40" />
                <input
                  type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 bg-[#F5F0E8] border-2 border-[#1A1A1A]/10 rounded-xl text-2xl font-bold text-[#1A1A1A] focus:border-[#6CB4E8] focus:outline-none transition-colors"
                  autoFocus step="0.01" min="0"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#F0C430]/20 rounded-2xl p-6 border-2 border-[#F0C430]/30">
          <p className="text-sm text-[#1A1A1A]/60">
            <strong className="text-[#1A1A1A]">Tip:</strong> Deposit $100 or more to unlock a new building!
          </p>
        </div>
      </main>

      <div className="sticky bottom-0 bg-[#FBF8F2] border-t-2 border-[#1A1A1A]/5 px-6 py-4">
        <button
          onClick={handleContinue} disabled={!isValid}
          className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all border-2 ${
            isValid
              ? 'bg-[#F0C430] text-[#1A1A1A] border-[#1A1A1A]/10 hover:shadow-xl active:scale-95'
              : 'bg-[#EDE8DC] text-[#1A1A1A]/30 border-[#1A1A1A]/5 cursor-not-allowed'
          }`}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}
