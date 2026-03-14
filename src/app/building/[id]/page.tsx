'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, TrendingUp } from 'lucide-react'
import { ensureCity, getPortfolio, mergeCards, type Card } from '@/lib/api'
import { getBuildingEmoji, getBuildingName } from '@/lib/building-images'

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
        if (!found) {
          router.replace('/')
          return
        }
        setCard(found)
        // Find other cards of the same type and level (excluding this one)
        const same = portfolio.cards.filter(
          c => c.id !== id && c.buildingType === found.buildingType && c.level === found.level
        )
        setSameCards(same)
      } catch (err) {
        console.error('Failed to load building:', err)
        router.replace('/')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  const handleMerge = async () => {
    if (!card || sameCards.length === 0) return

    setIsMerging(true)
    setMergeStep('spinning')

    try {
      // Short spinning animation
      await new Promise(resolve => setTimeout(resolve, 1500))

      const result = await mergeCards(card.id, sameCards[0].id)
      setMergedCard(result.card)
      setMergeStep('reveal')

      // Wait for reveal animation then go home
      await new Promise(resolve => setTimeout(resolve, 2500))
      router.replace('/')
    } catch (err) {
      console.error('Merge failed:', err)
      alert('Merge failed. Please try again.')
      setIsMerging(false)
      setMergeStep('idle')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#5B9BD5]/30 border-t-[#5B9BD5] rounded-full animate-spin" />
      </div>
    )
  }

  if (!card) return null

  const canMerge = sameCards.length > 0 && card.level < 8

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FC] via-[#FAFBFC] to-[#FFF8F0] flex flex-col">
      {/* Merge Animation Overlay */}
      {mergeStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-12 shadow-2xl max-w-md mx-6">
            {mergeStep === 'spinning' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#1F2937] mb-8" style={{ fontFamily: 'Fredoka' }}>
                  Combining Buildings...
                </h3>

                <div className="flex items-center justify-center gap-8 mb-8 relative">
                  <div className="animate-spin-slow">
                    <div className="w-28 h-28 bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#5B9BD5]/30">
                      <span className="text-5xl">{getBuildingEmoji(card.buildingType)}</span>
                    </div>
                    <div className="mt-2 bg-gradient-to-r from-[#FFA94D] to-[#FF9529] rounded-full px-3 py-1 mx-auto w-fit">
                      <span className="text-xs font-bold text-white">Lvl {card.level}</span>
                    </div>
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-full flex items-center justify-center shadow-lg z-10 animate-pulse">
                    <span className="text-white font-bold text-xl">+</span>
                  </div>

                  <div className="animate-spin-slow" style={{ animationDirection: 'reverse' }}>
                    <div className="w-28 h-28 bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#5B9BD5]/30">
                      <span className="text-5xl">{getBuildingEmoji(card.buildingType)}</span>
                    </div>
                    <div className="mt-2 bg-gradient-to-r from-[#FFA94D] to-[#FF9529] rounded-full px-3 py-1 mx-auto w-fit">
                      <span className="text-xs font-bold text-white">Lvl {card.level}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[#7C3AED]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <Sparkles className="w-6 h-6 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <Sparkles className="w-5 h-5 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {mergeStep === 'reveal' && mergedCard && (
              <div className="text-center animate-scale-in">
                <h3 className="text-3xl font-bold text-[#1F2937] mb-6" style={{ fontFamily: 'Fredoka' }}>
                  Success!
                </h3>

                <div className="mb-6">
                  <div className="w-40 h-40 mx-auto bg-gradient-to-br from-[#7C3AED]/20 to-[#6D28D9]/20 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-[#7C3AED]/40 relative animate-bounce-in">
                    <span className="text-[80px]">{getBuildingEmoji(mergedCard.buildingType)}</span>

                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#FFA94D] to-[#FF9529] rounded-full w-16 h-16 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                        {mergedCard.level}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xl font-bold text-[#7C3AED] mb-2" style={{ fontFamily: 'Fredoka' }}>
                  {getBuildingName(mergedCard.buildingType)}
                </p>
                <p className="text-[#6B7280]">
                  Upgraded to Level {mergedCard.level}!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#1F2937]" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1F2937]" style={{ fontFamily: 'Fredoka' }}>
              {getBuildingName(card.buildingType)}
            </h1>
            <p className="text-sm text-[#6B7280]">Level {card.level}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        {/* Building Image */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-black/5 mb-8">
          <div className="aspect-square bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] rounded-2xl overflow-hidden flex items-center justify-center mb-6 relative">
            <span className="text-[120px]">{getBuildingEmoji(card.buildingType)}</span>

            {/* Level Badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-[#FFA94D] to-[#FF9529] rounded-full w-16 h-16 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                {card.level}
              </span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#1F2937] mb-2" style={{ fontFamily: 'Fredoka' }}>
              {getBuildingName(card.buildingType)}
            </h2>
            <p className="text-lg text-[#6B7280]">
              Level <span className="font-bold text-[#5B9BD5]">{card.level}</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#5B9BD5]/10 to-white rounded-2xl p-6 border border-[#5B9BD5]/20">
            <p className="text-[#6B7280] text-sm mb-2">Current Level</p>
            <p className="text-4xl font-bold text-[#1F2937]" style={{ fontFamily: 'Fredoka' }}>
              {card.level}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#FFA94D]/10 to-white rounded-2xl p-6 border border-[#FFA94D]/20">
            <p className="text-[#6B7280] text-sm mb-2">Type</p>
            <p className="text-2xl font-bold text-[#1F2937]" style={{ fontFamily: 'Fredoka' }}>
              {getBuildingEmoji(card.buildingType)}
            </p>
          </div>
        </div>

        {/* Merge Section */}
        {canMerge && (
          <>
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-black/5 mb-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2937] mb-2" style={{ fontFamily: 'Fredoka' }}>
                    Combine Buildings
                  </h3>
                  <p className="text-sm text-[#6B7280]">
                    Combine 2 buildings of the same type to create 1 upgraded building at Level {card.level + 1}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 rounded-2xl p-4 border border-[#10B981]/20">
                <p className="text-sm text-[#10B981] font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Ready to combine! You have a matching building.
                </p>
              </div>
            </div>

            {/* Combine Formula */}
            <div className="bg-gradient-to-br from-[#7C3AED]/10 to-white rounded-2xl p-6 border border-[#7C3AED]/20 mb-8">
              <p className="text-center text-sm text-[#6B7280] mb-4 font-semibold">Combining Formula</p>
              <div className="flex items-center justify-center gap-3">
                <div className="bg-white rounded-xl p-3 shadow-md border border-[#E5E7EB]">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] rounded-lg flex items-center justify-center mb-1">
                    <span className="text-3xl">{getBuildingEmoji(card.buildingType)}</span>
                  </div>
                  <p className="text-xs text-center font-semibold text-[#1F2937]">Lvl {card.level}</p>
                </div>

                <span className="text-2xl text-[#6B7280] font-bold">+</span>

                <div className="bg-white rounded-xl p-3 shadow-md border border-[#E5E7EB]">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] rounded-lg flex items-center justify-center mb-1">
                    <span className="text-3xl">{getBuildingEmoji(card.buildingType)}</span>
                  </div>
                  <p className="text-xs text-center font-semibold text-[#1F2937]">Lvl {card.level}</p>
                </div>

                <span className="text-2xl text-[#7C3AED] font-bold">=</span>

                <div className="bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-xl p-3 shadow-lg border-2 border-white">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-1">
                    <span className="text-3xl">{getBuildingEmoji(card.buildingType)}</span>
                  </div>
                  <p className="text-xs text-center font-semibold text-white">Lvl {card.level + 1}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Fixed Bottom Button - Merge */}
      {canMerge && (
        <div className="bg-white border-t border-black/5 px-6 py-4">
          <button
            onClick={handleMerge}
            disabled={isMerging}
            className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-lg transition-all ${
              !isMerging
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:shadow-xl active:scale-95'
                : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            {isMerging ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Combining...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Combine 2 Buildings
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
