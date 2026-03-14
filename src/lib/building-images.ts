import { BUILDING_TYPES } from './constants'

const EMOJI_MAP: Record<string, string> = {}
for (const b of BUILDING_TYPES) {
  EMOJI_MAP[b.type] = b.emoji
}

const HAS_IMAGE = new Set(['bakery', 'bookshop', 'cafe', 'house', 'pet-shop'])

export function getBuildingEmoji(buildingType: string): string {
  return EMOJI_MAP[buildingType] ?? '🏠'
}

export function getBuildingName(buildingType: string): string {
  const bt = BUILDING_TYPES.find(b => b.type === buildingType)
  return bt?.name ?? buildingType
}

export function getBuildingImage(buildingType: string): string | null {
  if (!HAS_IMAGE.has(buildingType)) return null
  return `/buildings/${buildingType}.webp`
}
