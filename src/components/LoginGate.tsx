'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Sparkles } from 'lucide-react'

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy()

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5B9BD5]/30 border-t-[#5B9BD5] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1F2937] mb-2" style={{ fontFamily: 'Fredoka' }}>
            Honey Milk
          </h1>
          <p className="text-[#6B7280] mb-8">Build your village while earning yield</p>
          <button
            onClick={login}
            className="w-full py-4 px-6 rounded-2xl font-semibold shadow-lg bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] text-white hover:shadow-xl active:scale-95 transition-all"
          >
            Sign in with Email
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
