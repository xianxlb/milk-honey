'use client'

import { useEffect, useState } from 'react'
import type { AnimalType } from '@/lib/animals'
import { getAnimalName, getAnimalDialogue, getAnimalConfig } from '@/lib/animals'
import { getAnimalEmoji, getAnimalImage, hasAnimalSvg } from '@/lib/animal-images'
import { AnimalIllustration } from '@/components/animals'

interface Props {
  animalType: AnimalType
  level: number
  onDismiss: () => void
}

export function IntroDialogue({ animalType, level, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const img = getAnimalImage(animalType, level)
  const dialogue = getAnimalDialogue(animalType, 1)
  const visuals = (() => { try { return getAnimalConfig(animalType).visuals } catch { return null } })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onDismiss}
    >
      <div className="absolute inset-0 bg-[#1A1A1A]/40" />

      <div
        className={`relative w-full bg-[#FBF8F2] rounded-t-3xl border-t-2 border-[#1A1A1A]/8 shadow-2xl transition-transform duration-500 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-4 p-6 pb-2" style={{ minHeight: 200 }}>
          {/* Speech bubble — lavender Robert-style */}
          <div className="flex-1 rounded-2xl p-5 border-2 flex flex-col justify-center"
            style={{ backgroundColor: 'var(--lavender)', borderColor: 'color-mix(in srgb, var(--lavender-dark) 30%, transparent)' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--lavender-dark)', opacity: 0.6 }}>{getAnimalName(animalType)}</p>
            <p className="text-lg font-speech" style={{ color: 'var(--lavender-dark)' }}>&ldquo;{dialogue}&rdquo;</p>
          </div>

          {/* Animal face */}
          <div className="w-40 flex-shrink-0 rounded-2xl overflow-hidden border-2 border-[#1A1A1A]/8 flex items-center justify-center"
            style={visuals ? { background: `linear-gradient(to bottom right, ${visuals.bgGradient[0]}, ${visuals.bgGradient[1]})` } : { background: 'linear-gradient(to bottom right, #F5F0E8, #EDE8DC)' }}>
            {hasAnimalSvg(animalType)
              ? <AnimalIllustration animalType={animalType} size={120} expression="happy" />
              : img
                ? <img src={img} alt={animalType} className="w-full h-full object-cover object-top" />
                : <span className="text-7xl">{getAnimalEmoji(animalType)}</span>
            }
          </div>
        </div>

        <p
          className="text-center text-xs text-[#1A1A1A]/40 font-medium py-4 cursor-pointer"
          onClick={onDismiss}
        >
          Tap anywhere to continue
        </p>
      </div>
    </div>
  )
}
