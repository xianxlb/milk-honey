'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles } from 'lucide-react'
// TODO: rewire in Chunk 5
import { getBuildingEmoji, getBuildingImage, getBuildingName } from '@/lib/building-images'

function OpenPackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packId = searchParams.get('packId')

  const [stage, setStage] = useState<'cutting' | 'opening' | 'revealed'>('cutting')
  const [cutProgress, setCutProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [revealedCard, setRevealedCard] = useState<Card | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cutAreaRef = useRef<HTMLDivElement>(null)

  const getRemainingPacks = (): string[] => {
    try {
      const stored = sessionStorage.getItem('pending_packs')
      if (!stored) return []
      return JSON.parse(stored) as string[]
    } catch { return [] }
  }

  const remainingAfterThis = (): number => {
    const packs = getRemainingPacks()
    const idx = packs.indexOf(packId || '')
    return idx >= 0 ? packs.length - idx - 1 : 0
  }

  useEffect(() => { if (!packId) router.replace('/') }, [packId, router])

  const handleCutStart = () => { if (stage === 'cutting') setIsDragging(true) }

  const handleCutMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || stage !== 'cutting') return
    const cutArea = cutAreaRef.current
    if (!cutArea) return
    const rect = cutArea.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const progress = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setCutProgress(progress)
    if (progress > 90) { setIsDragging(false); handleOpenPack() }
  }

  const handleCutEnd = () => { setIsDragging(false); if (cutProgress < 90) setCutProgress(0) }

  const handleOpenPack = async () => {
    if (!packId) return
    setStage('opening')
    try {
      const result = await openPack(packId)
      setRevealedCard(result.card)
      setTimeout(() => setStage('revealed'), 1000)
    } catch (err) {
      console.error('Failed to open pack:', err)
      setError('Failed to open pack')
      setStage('revealed')
    }
  }

  const handleNext = () => {
    const packs = getRemainingPacks()
    const idx = packs.indexOf(packId || '')
    if (idx >= 0 && idx < packs.length - 1) {
      const nextPackId = packs[idx + 1]
      setCutProgress(0); setStage('cutting'); setRevealedCard(null); setError(null)
      router.replace(`/open-pack?packId=${nextPackId}`)
    } else {
      sessionStorage.removeItem('pending_packs')
      router.replace('/')
    }
  }

  if (!packId) return null
  const remaining = remainingAfterThis()

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/85 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {stage === 'cutting' && (
          <motion.div key="cutting" initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md px-6">
            <motion.div className="absolute -top-20 left-0 right-0 text-center text-white" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <p className="text-xl font-semibold mb-2">Swipe to cut open the pack!</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-1 bg-white/50 rounded-full" />
                <motion.div className="w-3 h-3 bg-white rounded-full" animate={{ x: [0, 40, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
              </div>
            </motion.div>
            <div className="relative">
              <div className="w-full aspect-[3/4] rounded-3xl shadow-2xl overflow-hidden relative bg-[#6CB4E8] border-4 border-[#1A1A1A]/15">
                <div className="absolute top-4 right-6 w-20 h-10 bg-white/25 rounded-full" />
                <div className="absolute top-8 right-12 w-14 h-7 bg-white/15 rounded-full" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  <div className="w-24 h-24 bg-[#F0C430] rounded-full flex items-center justify-center mb-4 border-4 border-[#1A1A1A]/10">
                    <span className="text-5xl">🎁</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white text-center" style={{ fontFamily: 'Fredoka' }}>Building Pack</h2>
                  <p className="text-white/60 text-sm mt-2 font-medium">Contains 1 random building</p>
                </div>
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
                <div ref={cutAreaRef} className="absolute top-0 left-0 right-0 h-24 cursor-grab active:cursor-grabbing z-20"
                  onMouseDown={handleCutStart} onMouseMove={handleCutMove} onMouseUp={handleCutEnd} onMouseLeave={handleCutEnd}
                  onTouchStart={handleCutStart} onTouchMove={handleCutMove} onTouchEnd={handleCutEnd}>
                  <div className="absolute top-16 left-0 right-0 h-2 border-t-2 border-dashed border-white/60" />
                  <div className="absolute top-16 left-0 h-2 bg-white/80" style={{ width: `${cutProgress}%` }} />
                  {cutProgress > 0 && (
                    <motion.div className="absolute top-12 text-2xl drop-shadow-lg" style={{ left: `${cutProgress}%` }} animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.3, repeat: Infinity }}>✂️</motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'opening' && (
          <motion.div key="opening" className="relative w-full max-w-md px-6">
            <div className="w-full aspect-[3/4] rounded-3xl shadow-2xl overflow-hidden relative bg-[#6CB4E8] border-4 border-[#1A1A1A]/15">
              <motion.div className="absolute inset-0 bg-gradient-to-r from-[#F0C430] via-white to-[#F0C430]" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 2, 3] }} transition={{ duration: 1 }} />
            </div>
          </motion.div>
        )}

        {stage === 'revealed' && (
          <motion.div key="revealed" initial={{ scale: 0.5, rotateY: 180, opacity: 0 }} animate={{ scale: 1, rotateY: 0, opacity: 1 }} transition={{ duration: 0.8, ease: 'backOut' }} className="relative w-full max-w-sm px-6">
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div key={i} className="absolute text-2xl" initial={{ x: '50%', y: '50%', scale: 0, opacity: 1 }}
                  animate={{ x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%`, scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, delay: i * 0.05, ease: 'easeOut' }}>✨</motion.div>
              ))}
            </div>

            {error ? (
              <div className="bg-[#FBF8F2] rounded-3xl p-8 shadow-2xl text-center border-2 border-[#1A1A1A]/10">
                <p className="text-[#DC2626] font-semibold mb-4">{error}</p>
                <button onClick={() => router.replace('/')} className="px-6 py-3 bg-[#6CB4E8] text-white rounded-xl font-semibold">Go Home</button>
              </div>
            ) : revealedCard && (
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                <div className="bg-[#FBF8F2] rounded-3xl shadow-2xl p-6 border-4 border-[#F0C430]">
                  <div className="flex justify-center mb-4">
                    <div className="bg-[#F0C430] px-6 py-2 rounded-full border-2 border-[#1A1A1A]/10">
                      <p className="text-[#1A1A1A] font-bold text-sm">NEW BUILDING!</p>
                    </div>
                  </div>
                  <div className="relative mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] p-4">
                    <div className="w-full h-64 flex items-center justify-center">
                      {getBuildingImage(revealedCard.buildingType) ? (
                        <img src={getBuildingImage(revealedCard.buildingType)!} alt={getBuildingName(revealedCard.buildingType)} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[120px]">{getBuildingEmoji(revealedCard.buildingType)}</span>
                      )}
                    </div>
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Fredoka' }}>{getBuildingName(revealedCard.buildingType)}</h3>
                    <div className="flex items-center justify-center gap-2 text-[#1A1A1A]/50">
                      <Sparkles className="w-4 h-4 text-[#F0C430]" />
                      <p className="text-sm font-semibold">Level {revealedCard.level} Building</p>
                      <Sparkles className="w-4 h-4 text-[#F0C430]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}
              onClick={handleNext}
              className="w-full mt-6 py-4 bg-[#F0C430] text-[#1A1A1A] rounded-2xl font-bold shadow-lg border-2 border-[#1A1A1A]/10 hover:shadow-xl active:scale-95 transition-all">
              {remaining > 0 ? `Next Pack (${remaining} remaining)` : 'Add to Village'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function OpenPackPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 bg-[#1A1A1A]/85 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <OpenPackContent />
    </Suspense>
  )
}
