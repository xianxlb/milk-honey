'use client'

import { BuildingType } from '@/store/types'

interface BuildingArtProps {
  type: BuildingType
  level: number
  isWilting?: boolean
  showLevelUp?: boolean
}

const BUILDING_COLORS: Record<BuildingType, { primary: string; secondary: string; accent: string }> = {
  'flower-shop': { primary: '#F8B4D9', secondary: '#F472B6', accent: '#EC4899' },
  'pet-shop':    { primary: '#FCD34D', secondary: '#FBBF24', accent: '#F59E0B' },
  'bookshop':    { primary: '#93C5FD', secondary: '#60A5FA', accent: '#3B82F6' },
  'farm':        { primary: '#86EFAC', secondary: '#4ADE80', accent: '#22C55E' },
}

const BUILDING_EMOJI: Record<BuildingType, string[]> = {
  'flower-shop': ['🌷', '💐', '🌸', '🌺', '🌹', '🌻', '🌼', '🏵️'],
  'pet-shop':    ['🐕', '🐈', '🐾', '🦴', '🐦', '🦆', '🐠', '🏡'],
  'bookshop':    ['📖', '📚', '🐱', '📕', '📗', '🏫', '📜', '🏛️'],
  'farm':        ['🌱', '🌾', '🐔', '🐄', '🌳', '🌽', '🚜', '🏰'],
}

// Visual tier: L1=small, L3=medium, L5=large, L8=grand
function getVisualTier(level: number): { height: number; width: number; floors: number } {
  if (level <= 2) return { height: 60, width: 50, floors: 1 }
  if (level <= 4) return { height: 80, width: 60, floors: 1 }
  if (level <= 7) return { height: 100, width: 70, floors: 2 }
  return { height: 120, width: 80, floors: 2 }
}

function hasAddition(level: number): boolean {
  return level === 2 || level === 4 || level === 6 || level === 7
}

export default function BuildingArt({ type, level, isWilting, showLevelUp }: BuildingArtProps) {
  const colors = BUILDING_COLORS[type]
  const emojis = BUILDING_EMOJI[type]
  const tier = getVisualTier(level)
  const addition = hasAddition(level)

  return (
    <div className="relative flex flex-col items-center">
      {showLevelUp && (
        <div className="absolute -top-6 animate-bounce text-xl z-10">✨</div>
      )}
      <div
        className={`relative rounded-t-lg border-2 transition-all duration-500 ${
          isWilting ? 'opacity-40 grayscale' : ''
        }`}
        style={{
          width: tier.width,
          height: tier.height,
          backgroundColor: colors.primary,
          borderColor: colors.secondary,
        }}
      >
        {/* Roof */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-t-lg"
          style={{
            width: tier.width + 10,
            height: 12,
            backgroundColor: colors.secondary,
          }}
        />
        {/* Windows */}
        <div className="flex justify-center gap-1 pt-4">
          {Array.from({ length: Math.min(tier.floors + 1, 3) }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: colors.accent }}
            />
          ))}
        </div>
        {/* Second floor for L5+ */}
        {tier.floors >= 2 && (
          <div className="flex justify-center gap-1 pt-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: colors.accent }}
              />
            ))}
          </div>
        )}
        {/* Door */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-sm"
          style={{
            width: tier.width * 0.25,
            height: tier.height * 0.2,
            backgroundColor: colors.accent,
          }}
        />
        {/* Main emoji */}
        <div className="absolute -bottom-1 -right-2 text-lg">
          {emojis[Math.min(level - 1, emojis.length - 1)]}
        </div>
        {/* Addition accent for even levels */}
        {addition && (
          <div className="absolute -bottom-1 -left-2 text-sm">
            {emojis[Math.min(level, emojis.length - 1)]}
          </div>
        )}
      </div>
      {/* Ground */}
      <div
        className="rounded-b"
        style={{
          width: tier.width + 20,
          height: 6,
          backgroundColor: '#D1FAE5',
        }}
      />
    </div>
  )
}
