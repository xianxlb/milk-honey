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

  useEffect(() => {
    if (ready && !authenticated) login()
  }, [ready, authenticated, login])

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col" style={{
      background: 'radial-gradient(ellipse 120% 60% at 50% 0%, #FDE98A 0%, #F5F0E8 55%)',
    }}>
      <div className="flex flex-col items-center justify-center flex-1 gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#F0C430]/30 blur-2xl scale-150" />
          <img src="/mascot.png" alt="Milk & Honey" className="relative w-28 h-28 drop-shadow-lg" />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#1A1A1A] tracking-tight" style={{ fontFamily: 'Fredoka' }}>
            Milk & Honey
          </h1>
          <p className="text-[#1A1A1A]/50 mt-1 font-medium text-base">
            Gather your crew. Earn real yield.
          </p>
        </div>
        <div className="w-10 h-10 border-4 border-[#F0C430]/40 border-t-[#F0C430] rounded-full animate-spin mt-4" />
      </div>
    </div>
  )
}
