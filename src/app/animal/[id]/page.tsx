'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getPortfolio, mergeCards } from '@/lib/client-api'
import { getAnimalEmoji, getAnimalImage } from '@/lib/animal-images'
import { getAnimalName, getAnimalPersonality, getAnimalDialogue, type AnimalType } from '@/lib/animals'
import { MAX_LEVEL } from '@/lib/constants'

type Card = { id: string; animal_type: string; level: number }

export default function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { ready, getAccessToken } = useAuth()
  const [card, setCard] = useState<Card | null>(null)
  const [sameCards, setSameCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [isMerging, setIsMerging] = useState(false)
  const [mergeStep, setMergeStep] = useState<'idle' | 'spinning' | 'reveal'>('idle')
  const [mergedCard, setMergedCard] = useState<Card | null>(null)

  useEffect(() => {
    if (!ready) return
    async function load() {
      try {
        const token = await getAccessToken()
        if (!token) return
        const portfolio = await getPortfolio(token)
        const found = portfolio.cards.find((c: Card) => c.id === id)
        if (!found) { router.replace('/'); return }
        setCard(found)
        setSameCards(portfolio.cards.filter((c: Card) =>
          c.id !== id && c.animal_type === found.animal_type && c.level === found.level
        ))
      } catch (err) {
        console.error('Failed to load animal:', err)
        router.replace('/')
      } finally { setLoading(false) }
    }
    load()
  }, [id, router, ready, getAccessToken])

  const handleMerge = async () => {
    if (!card || sameCards.length === 0) return
    setIsMerging(true); setMergeStep('spinning')
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const token = await getAccessToken()
      const result = await mergeCards(token!, card.id, sameCards[0].id)
      setMergedCard(result.card); setMergeStep('reveal')
      await new Promise(resolve => setTimeout(resolve, 2500))
      router.replace('/')
    } catch (err) {
      console.error('Merge failed:', err)
      alert('Merge failed. Please try again.')
      setIsMerging(false); setMergeStep('idle')
    }
  }

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6CB4E8]/30 border-t-[#6CB4E8] rounded-full animate-spin" />
      </div>
    )
  }

  if (!card) return null
  const canMerge = sameCards.length > 0 && card.level < MAX_LEVEL
  const animalType = card.animal_type as AnimalType
  const img = getAnimalImage(card.animal_type, card.level)

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {mergeStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/60 backdrop-blur-md">
          <div className="bg-[#FBF8F2] rounded-3xl p-12 shadow-2xl max-w-md mx-6 border-2 border-[#1A1A1A]/10">
            {mergeStep === 'spinning' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-8" style={{ fontFamily: 'Fredoka' }}>Combining...</h3>
                <div className="flex items-center justify-center gap-8 mb-8 relative">
                  <div className="animate-spin-slow">
                    <div className="w-28 h-28 bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#1A1A1A]/10">
                      <span className="text-5xl">{getAnimalEmoji(card.animal_type)}</span>
                    </div>
                    <div className="mt-2 bg-[#6CB4E8] rounded-full px-3 py-1 mx-auto w-fit"><span className="text-xs font-bold text-white">Lv.{card.level}</span></div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#F0C430] rounded-full flex items-center justify-center shadow-lg z-10 animate-pulse border-2 border-[#1A1A1A]/10">
                    <span className="text-[#1A1A1A] font-bold text-xl">+</span>
                  </div>
                  <div className="animate-spin-slow" style={{ animationDirection: 'reverse' }}>
                    <div className="w-28 h-28 bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#1A1A1A]/10">
                      <span className="text-5xl">{getAnimalEmoji(card.animal_type)}</span>
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
                <h3 className="text-3xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: 'Fredoka' }}>Leveled up!</h3>
                <div className="mb-6">
                  <div className="w-40 h-40 mx-auto bg-gradient-to-br from-[#6CB4E8]/20 to-[#F0C430]/20 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-[#F0C430]/40 relative animate-bounce-in">
                    {getAnimalImage(mergedCard.animal_type, mergedCard.level)
                      ? <img src={getAnimalImage(mergedCard.animal_type, mergedCard.level)!} alt={mergedCard.animal_type} className="w-full h-full object-contain" />
                      : <span className="text-[80px]">{getAnimalEmoji(mergedCard.animal_type)}</span>
                    }
                    <div className="absolute -top-3 -right-3 bg-[#F0C430] rounded-xl px-3 py-1 border-4 border-[#FBF8F2] shadow-lg">
                      <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Lv.{mergedCard.level}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xl font-bold text-[#6CB4E8] mb-2" style={{ fontFamily: 'Fredoka' }}>{getAnimalName(mergedCard.animal_type as AnimalType)}</p>
                <p className="text-[#1A1A1A]/50">Now Level {mergedCard.level}!</p>
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
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>{getAnimalName(animalType)}</h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">Level {card.level}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="bg-[#FBF8F2] rounded-3xl p-8 shadow-lg border-2 border-[#1A1A1A]/8 mb-6">
          <div className="aspect-square bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] rounded-2xl overflow-hidden flex items-center justify-center mb-6 relative">
            {img
              ? <img src={img} alt={animalType} className="w-full h-full object-contain" />
              : <span className="text-[120px]">{getAnimalEmoji(card.animal_type)}</span>
            }
            <div className="absolute top-4 right-4 bg-[#F0C430] rounded-xl px-4 py-2 shadow-lg border-2 border-[#1A1A1A]/10">
              <span className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: 'Fredoka' }}>Lv.{card.level}</span>
            </div>
          </div>
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: 'Fredoka' }}>{getAnimalName(animalType)}</h2>
            <p className="text-sm text-[#1A1A1A]/40 font-medium">{getAnimalPersonality(animalType)}</p>
          </div>
          <div className="bg-[#F5F0E8] rounded-2xl px-5 py-4 border-2 border-[#1A1A1A]/8">
            <p className="text-[#1A1A1A]/80 text-sm font-medium italic">
              &ldquo;{getAnimalDialogue(animalType, card.level)}&rdquo;
            </p>
          </div>
        </div>

        {canMerge && (
          <div className="bg-[#FBF8F2] rounded-3xl p-6 shadow-lg border-2 border-[#1A1A1A]/8">
            <div className="bg-[#F0C430]/20 rounded-2xl p-4 border-2 border-[#F0C430]/30">
              <p className="text-sm text-[#1A1A1A]/70 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F0C430]" />
                You have a matching {getAnimalName(animalType)}! Ready to combine.
              </p>
            </div>
          </div>
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
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />Combine 2 {getAnimalName(animalType)}s
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
