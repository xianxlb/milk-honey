'use client'

import { AnimalIllustration } from '@/components/animals'
import { ANIMAL_TYPES, type AnimalType } from '@/lib/animals'

const expressions = ['neutral', 'happy', 'sleeping', 'celebrating'] as const

export default function PreviewAnimalsPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] p-4">
      <h1 className="text-2xl font-bold text-center mb-1" style={{ fontFamily: 'Fredoka' }}>Animal Illustrations</h1>
      <p className="text-center text-[#1A1A1A]/40 mb-6 text-xs">Robert-style thick-outlined warm SVGs</p>

      {/* Grid preview like home page */}
      <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'Fredoka' }}>Home Grid</h2>
      <div className="grid grid-cols-4 gap-3 mb-8">
        {ANIMAL_TYPES.map((animal) => (
          <div key={animal.type} className="bg-[#FBF8F2] rounded-2xl p-2 shadow-md border-2 border-[#1A1A1A]/8">
            <div
              className="aspect-square rounded-xl mb-1 overflow-hidden flex items-center justify-center"
              style={{ background: `linear-gradient(to bottom right, ${animal.visuals.bgGradient[0]}, ${animal.visuals.bgGradient[1]})` }}
            >
              <AnimalIllustration animalType={animal.type as AnimalType} size={72} />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-semibold text-[#1A1A1A] truncate">{animal.name}</p>
              <p className="text-[8px] text-[#1A1A1A]/40">Lv.1</p>
            </div>
          </div>
        ))}
      </div>

      {/* Expression states */}
      <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'Fredoka' }}>Expressions</h2>
      {ANIMAL_TYPES.map((animal) => (
        <div key={animal.type} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-sm">{animal.name}</span>
            <span className="text-[10px] text-[#1A1A1A]/30">{animal.type}</span>
            <span className="font-speech text-sm px-2 py-0.5 rounded-lg" style={{ backgroundColor: 'var(--lavender)', color: 'var(--lavender-dark)' }}>
              &ldquo;{animal.dialogue[0]}&rdquo;
            </span>
          </div>
          <div className="flex gap-3">
            {expressions.map((expr) => (
              <div key={expr} className="text-center">
                <div
                  className="w-24 h-24 rounded-xl flex items-center justify-center border-2 border-[#1A1A1A]/8"
                  style={{ background: `linear-gradient(to bottom right, ${animal.visuals.bgGradient[0]}, ${animal.visuals.bgGradient[1]})` }}
                >
                  <AnimalIllustration animalType={animal.type as AnimalType} size={80} expression={expr} />
                </div>
                <p className="text-[9px] text-[#1A1A1A]/30 mt-1">{expr}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Intro dialogue preview */}
      <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'Fredoka' }}>Speech Bubble Style</h2>
      <div className="flex gap-4 p-4 bg-[#FBF8F2] rounded-2xl border-2 border-[#1A1A1A]/8 mb-8">
        <div className="flex-1 rounded-2xl p-4 border-2" style={{ backgroundColor: 'var(--lavender)', borderColor: 'rgba(73,93,165,0.3)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--lavender-dark)', opacity: 0.6 }}>Maple</p>
          <p className="text-lg font-speech" style={{ color: 'var(--lavender-dark)' }}>&ldquo;We&rsquo;ll figure it out when we get there.&rdquo;</p>
        </div>
        <div className="w-28 flex-shrink-0 rounded-2xl overflow-hidden border-2 border-[#1A1A1A]/8 flex items-center justify-center"
          style={{ background: 'linear-gradient(to bottom right, #FFEFC5, #F5F0E8)' }}>
          <AnimalIllustration animalType="cow" size={100} expression="happy" />
        </div>
      </div>
    </div>
  )
}
