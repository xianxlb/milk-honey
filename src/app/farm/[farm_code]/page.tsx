'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ReferralCard, type ReferralCardData } from '@/components/referral-card'

export default function FarmPage() {
  const params = useParams()
  const router = useRouter()
  const farmCode = params.farm_code as string
  const [data, setData] = useState<ReferralCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!farmCode) return
    const load = async () => {
      try {
        const res = await fetch(`/api/referral/${farmCode}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) throw new Error('Failed to load')
        const result = await res.json()
        setData(result)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [farmCode])

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>
            🍯 Milk & Honey
          </h1>
          <p className="text-sm text-[#1A1A1A]/50 font-medium mt-1">Earn real yield on your savings</p>
        </div>

        {loading ? (
          <div className="bg-[#FBF8F2] rounded-3xl h-64 animate-pulse border-2 border-[#1A1A1A]/8" />
        ) : notFound || !data ? (
          <div className="bg-[#FBF8F2] rounded-3xl p-8 border-2 border-[#1A1A1A]/8 text-center">
            <p className="text-2xl mb-2">🏚️</p>
            <p className="font-bold text-[#1A1A1A]">Farm not found</p>
            <p className="text-sm text-[#1A1A1A]/50 mt-1">This farm code doesn&apos;t exist.</p>
          </div>
        ) : (
          <ReferralCard data={data} />
        )}

        {/* CTA */}
        <button
          onClick={() => router.push('/login')}
          className="w-full py-4 px-6 rounded-2xl bg-[#F0C430] text-[#1A1A1A] font-bold text-base shadow-lg border-2 border-[#1A1A1A]/10 hover:shadow-xl active:scale-95 transition-all"
          style={{ fontFamily: 'Fredoka' }}
        >
          Join and start saving →
        </button>

      </div>
    </div>
  )
}
