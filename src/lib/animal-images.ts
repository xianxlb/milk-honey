import { ANIMAL_TYPE_CONFIGS } from './constants'
import type { AnimalType } from './animals'

const EMOJI_MAP: Record<string, string> = {}
for (const a of ANIMAL_TYPE_CONFIGS) {
  EMOJI_MAP[a.type] = a.emoji
}

// Add keys like 'cow-1', 'cow-2' as art assets are added to public/animals/{type}/level-{n}.png
const HAS_IMAGE = new Set<string>([])

// All 8 animals have SVG illustration components
const HAS_SVG = new Set<string>([
  'cow', 'pig', 'duck', 'raccoon', 'sheep', 'frog', 'chicken', 'bear'
])

export function hasAnimalSvg(animalType: string): boolean {
  return HAS_SVG.has(animalType as AnimalType)
}

export function getAnimalEmoji(animalType: string): string {
  return EMOJI_MAP[animalType] ?? '🐾'
}

export function getAnimalImage(animalType: string, level: number): string | null {
  if (!HAS_IMAGE.has(`${animalType}-${level}`)) return null
  return `/animals/${animalType}/level-${level}.png`
}
