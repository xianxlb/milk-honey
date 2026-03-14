'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, TrendingUp } from 'lucide-react'
import { ensureCity, getPortfolio, mergeCards, type Card } from '@/lib/api'
import { getBuildingEmoji, getBuildingImage, getBuildingName } from '@/lib/building-images'

export default function BuildingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [card, setCard] = useState<Card | null>(null)
  const [sameCards, setSameCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [isMerging, setIsMerging] = useState(false)
  const [mergeStep, setMergeStep] = useState<'idle' | 'spinning' | 'reveal'>('idle')
  const [mergedCard, setMergedCard] = useState<Card | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const cityId = await ensureCity()
        const portfolio = await getPortfolio(cityId)
        const found = portfolio.cards.find(c => c.id === id)
        if (!found) { router.replace('/'); return }
        setCard(found)
        setSameCards(portfolio.cards.filter(c => c.id !== id && c.buildingType === found.buildingType && c.level === found.level))
      } catch (err) {
        console.error('Failed to load building:', err)
        router.replace('/')
      } finally { setLoading(false) }
    }
    load()
  }, [id, router])

  const handleMerge = async () => {
    if (!card || sameCards.length === 0) return
    setIsMerging(true); setMergeStep('spinning')
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const result = await mergeCards(card.id, sameCards[0].id)
      setMergedCard(result.card); setMergeStep('reveal')
      await new Promise(resolve => setTimeout(resolve, 2500))
      router.replace('/')
    } catch (err) {
      console.error('Merge failed:', err)
      alert('Merge failed. Please try again.')
      setIsMerging(false); setMergeStep('idle')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6CB4E8]/30 border-t-[#6CB4E8] rounded-full animate-spin" />
      </div>
    )
  }

  if (!card) return null
  const canMerge = sameCards.length > 0 && card.level < 8

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {/* Merge Animation Overlay */}
      {mergeStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/60 backdrop-blur-md">
          <div className="bg-[#FBF8F2] rounded-3xl p-12 shadow-2xl max-w-md mx-6 border-2 border-[#1A1A1A]/10">
            {mergeStep === 'spinning' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-8" style={{ fontFamily: 'Fredoka' }}>Combining Buildings...</h3>
                <div className="flex items-center justify-center gap-8 mb-8 relative">
                  <div className="animate-spin-slow">
                    <div className="w-28 h-28 bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#1A1A1A]/10">
                      <span className="text-5xl">{getBuildingEmoji(card.buildingType)}</span>
                    </div>
                    <div className="mt-2 bg-[#6CB4E8] rounded-full px-3 py-1 mx-auto w-fit"><span className="text-xs font-bold text-white">Lv.{card.level}</span></div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#F0C430] rounded-full flex items-center justify-center shadow-lg z-10 animate-pulse border-2 border-[#1A1A1A]/10">
                    <span className="text-[#1A1A1A] font-bold text-xl">+</span>
                  </div>
                  <div className="animate-spin-slow" style={{ animationDirection: 'reverse' }}>
                    <div className="w-28 h-28 bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#1A1A1A]/10">
                      <span className="text-5xl">{getBuildingEmoji(card.buildingType)}</span>
                    </div>
                    <div className="mt-2 bg-[#6CB4E8] rounded-full px-3 py-1 mx-auto w-fit"><span className="text-xs font-bold text-white">Lv.{card.level}</span></div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-[#F0C430]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <Sparkles className="w-6 h-6 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <Sparkles className="w-5 h-5 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {mergeStep === 'reveal' && mergedCard && (
              <div className="text-center animate-scale-in">
                <h3 className="text-3xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: 'Fredoka' }}>Success!</h3>
                <div className="mb-6">
                  <div className="w-40 h-40 mx-auto bg-gradient-to-br from-[#6CB4E8]/20 to-[#F0C430]/20 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-[#F0C430]/40 relative animate-bounce-in">
                    {getBuildingImage(mergedCard.buildingType) ? (
                      <img src={getBuildingImage(mergedCard.buildingType)!} alt={getBuildingName(mergedCard.buildingType)} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[80px]">{getBuildingEmoji(mergedCard.buildingType)}</span>
                    )}
                    <div className="absolute -top-3 -right-3 bg-[#F0C430] rounded-xl px-3 py-1 border-4 border-[#FBF8F2] shadow-lg">
                      <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Lv.{mergedCard.level}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xl font-bold text-[#6CB4E8] mb-2" style={{ fontFamily: 'Fredoka' }}>{getBuildingName(mergedCard.buildingType)}</p>
                <p className="text-[#1A1A1A]/50">Upgraded to Level {mergedCard.level}!</p>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="bg-[#FBF8F2] border-b-2 border-[#1A1A1A]/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center hover:bg-[#EDE8DC] transition-colors border-2 border-[#1A1A1A]/8">
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>{getBuildingName(card.buildingType)}</h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">Level {card.level}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="bg-[#FBF8F2] rounded-3xl p-8 shadow-lg border-2 border-[#1A1A1A]/8 mb-8">
          <div className="aspect-square bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-2xl overflow-hidden flex items-center justify-center mb-6 relative">
            {getBuildingImage(card.buildingType) ? (
              <img src={getBuildingImage(card.buildingType)!} alt={getBuildingName(card.buildingType)} className="w-full h-full object-contain" />
            ) : (
              <span className="text-[120px]">{getBuildingEmoji(card.buildingType)}</span>
            )}
            <div className="absolute top-4 right-4 bg-[#F0C430] rounded-xl px-4 py-2 shadow-lg border-2 border-[#1A1A1A]/10">
              <span className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Lv.{card.level}</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Fredoka' }}>{getBuildingName(card.buildingType)}</h2>
            <p className="text-lg text-[#1A1A1A]/50">Level <span className="font-bold text-[#6CB4E8]">{card.level}</span></p>
          </div>
        </div>

        {canMerge && (
          <>
            <div className="bg-[#FBF8F2] rounded-3xl p-6 shadow-lg border-2 border-[#1A1A1A]/8 mb-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-[#6CB4E8] rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-[#1A1A1A]/10">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Fredoka' }}>Combine Buildings</h3>
                  <p className="text-sm text-[#1A1A1A]/50">Combine 2 same buildings to upgrade to Level {card.level + 1}</p>
                </div>
              </div>
              <div className="bg-[#F0C430]/20 rounded-2xl p-4 border-2 border-[#F0C430]/30">
                <p className="text-sm text-[#1A1A1A]/70 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F0C430]" />
                  Ready to combine! You have a matching building.
                </p>
              </div>
            </div>

            <div className="bg-[#6CB4E8]/10 rounded-2xl p-6 border-2 border-[#6CB4E8]/20 mb-8">
              <p className="text-center text-sm text-[#1A1A1A]/50 mb-4 font-semibold">Combining Formula</p>
              <div className="flex items-center justify-center gap-3">
                <div className="bg-[#FBF8F2] rounded-xl p-3 shadow-md border-2 border-[#1A1A1A]/8">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-lg flex items-center justify-center mb-1">
                    <span className="text-3xl">{getBuildingEmoji(card.buildingType)}</span>
                  </div>
                  <p className="text-xs text-center font-semibold text-[#1A1A1A]">Lv.{card.level}</p>
                </div>
                <span className="text-2xl text-[#1A1A1A]/30 font-bold">+</span>
                <div className="bg-[#FBF8F2] rounded-xl p-3 shadow-md border-2 border-[#1A1A1A]/8">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-lg flex items-center justify-center mb-1">
                    <span className="text-3xl">{getBuildingEmoji(card.buildingType)}</span>
                  </div>
                  <p className="text-xs text-center font-semibold text-[#1A1A1A]">Lv.{card.level}</p>
                </div>
                <span className="text-2xl text-[#F0C430] font-bold">=</span>
                <div className="bg-[#6CB4E8] rounded-xl p-3 shadow-lg border-2 border-[#1A1A1A]/10">
                  <div className="w-12 h-12 bg-white/25 rounded-lg flex items-center justify-center mb-1">
                    <span className="text-3xl">{getBuildingEmoji(card.buildingType)}</span>
                  </div>
                  <p className="text-xs text-center font-semibold text-white">Lv.{card.level + 1}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {canMerge && (
        <div className="sticky bottom-0 bg-[#FBF8F2] border-t-2 border-[#1A1A1A]/5 px-6 py-4">
          <button onClick={handleMerge} disabled={isMerging}
            className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all border-2 ${
              !isMerging ? 'bg-[#6CB4E8] text-white border-[#1A1A1A]/10 hover:shadow-xl active:scale-95' : 'bg-[#EDE8DC] text-[#1A1A1A]/30 border-[#1A1A1A]/5 cursor-not-allowed'
            }`}>
            {isMerging ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Combining...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2"><Sparkles className="w-5 h-5" />Combine 2 Buildings</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
