import { ANIMAL_TYPE_CONFIGS } from './constants'

const EMOJI_MAP: Record<string, string> = {}
for (const a of ANIMAL_TYPE_CONFIGS) {
  EMOJI_MAP[a.type] = a.emoji
}

// Add keys like 'cow-1', 'cow-2' as art assets are added to public/animals/{type}/level-{n}.png
const HAS_IMAGE = new Set<string>([])

export function getAnimalEmoji(animalType: string): string {
  return EMOJI_MAP[animalType] ?? '🐾'
}

export function getAnimalImage(animalType: string, level: number): string | null {
  if (!HAS_IMAGE.has(`${animalType}-${level}`)) return null
  return `/animals/${animalType}/level-${level}.png`
}
