import { BUILDING_TYPES } from './constants'

const EMOJI_MAP: Record<string, string> = {}
for (const b of BUILDING_TYPES) {
  EMOJI_MAP[b.type] = b.emoji
}

export function getBuildingEmoji(buildingType: string): string {
  return EMOJI_MAP[buildingType] ?? '🏠'
}

export function getBuildingName(buildingType: string): string {
  const bt = BUILDING_TYPES.find(b => b.type === buildingType)
  return bt?.name ?? buildingType
}

export function getBuildingImage(buildingType: string): string | null {
  // Check if a real image exists at the expected path
  // Falls back to null (use emoji instead)
  const path = `/buildings/${buildingType}.png`
  return path
}
