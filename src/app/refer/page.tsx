'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useAuthedSWR } from '@/hooks/use-authed-swr'
import { BottomNav } from '@/components/bottom-nav'
import { ReferralCard, type ReferralCardData } from '@/components/referral-card'
import { ensureUser } from '@/lib/client-api'

export default function ReferPage() {
  const router = useRouter()
  const { ready, getAccessToken } = useAuth()
  const { data, mutate } = useAuthedSWR<ReferralCardData>('/api/referral/me')

  const handleNameSave = async (name: string) => {
    const token = await getAccessToken()
    if (!token) return
    await ensureUser(token, name)
    mutate(prev => prev ? { ...prev, farmName: name } : prev, false)
  }

  if (!ready) return <div className="min-h-screen bg-[#F5F0E8]" />

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col pb-20">
      <header className="bg-[#FBF8F2] border-b-2 border-[#1A1A1A]/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')}
            className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center border-2 border-[#1A1A1A]/8">
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Refer</h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">Share your farm, grow together</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        {!data ? (
          <div className="bg-[#FBF8F2] rounded-3xl h-64 animate-pulse border-2 border-[#1A1A1A]/8" />
        ) : data ? (
          <ReferralCard
            data={data}
            showShareButton
            appUrl="https://milk-honey-eight.vercel.app"
            onNameSave={handleNameSave}
          />
        ) : (
          <div className="bg-[#FBF8F2] rounded-3xl p-6 border-2 border-[#1A1A1A]/8 text-center">
            <p className="text-sm text-[#1A1A1A]/50 font-medium">Could not load farm data.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
