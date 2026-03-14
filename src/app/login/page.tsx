'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { ready, authenticated, login } = usePrivy()
  const router = useRouter()

  useEffect(() => {
    if (ready && authenticated) router.replace('/')
  }, [ready, authenticated, router])

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6CB4E8]/30 border-t-[#6CB4E8] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center gap-6 px-6">
      <img src="/mascot.png" alt="Milk & Honey" className="w-24 h-24" />
      <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>
        Milk & Honey
      </h1>
      <p className="text-[#1A1A1A]/60 text-center font-medium">
        Build your village. Earn real yield.
      </p>
      <button
        onClick={login}
        className="w-full max-w-sm bg-[#F0C430] text-[#1A1A1A] py-4 px-6 rounded-2xl font-bold shadow-lg border-2 border-[#1A1A1A]/10 hover:shadow-xl transition-all active:scale-95"
      >
        Sign in to play
      </button>
    </div>
  )
}
