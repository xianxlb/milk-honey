'use client'

import { useEffect, useState } from 'react'
import type { AnimalType } from '@/lib/animals'
import { getAnimalName, getAnimalDialogue } from '@/lib/animals'
import { getAnimalEmoji, getAnimalImage } from '@/lib/animal-images'

interface Props {
  animalType: AnimalType
  level: number
  onDismiss: () => void
}

export function IntroDialogue({ animalType, level, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slight delay so the slide-up animation triggers after mount
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const img = getAnimalImage(animalType, level)
  const dialogue = getAnimalDialogue(animalType, 1) // always show level-1 intro line

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1A1A1A]/40" />

      {/* Overlay panel */}
      <div
        className={`relative w-full bg-[#FBF8F2] rounded-t-3xl border-t-2 border-[#1A1A1A]/8 shadow-2xl transition-transform duration-500 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-4 p-6 pb-2" style={{ minHeight: 200 }}>
          {/* Speech bubble */}
          <div className="flex-1 bg-[#F5F0E8] rounded-2xl p-5 border-2 border-[#1A1A1A]/8 flex flex-col justify-center">
            <p className="text-sm font-semibold text-[#1A1A1A]/50 mb-2">{getAnimalName(animalType)}</p>
            <p className="text-[#1A1A1A] font-medium italic">&ldquo;{dialogue}&rdquo;</p>
          </div>

          {/* Animal face — zoomed/cropped */}
          <div className="w-40 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC] border-2 border-[#1A1A1A]/8 flex items-center justify-center">
            {img
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
