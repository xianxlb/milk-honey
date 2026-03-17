import { AnimalTypeConfig } from '@/store/types'

export const LEVEL_THRESHOLDS = [20, 40, 80, 160, 320, 640, 1280, 2560] as const
export const MAX_LEVEL = 8
export const MIN_DEPOSIT = 1
export const MAX_ANIMALS = 20
export const MAX_SPAWNS_PER_DAY = 2
export const SPAWN_WINDOW_MS = 24 * 60 * 60 * 1000
export const WILT_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000
export const TOKENS_PER_DOLLAR = 10

export const ANIMAL_TYPE_CONFIGS: AnimalTypeConfig[] = [
  { type: 'cow',     name: 'Bessie',       emoji: '🐄', unlockProsperity: 0 },
  { type: 'pig',     name: 'Sir Reginald', emoji: '🐷', unlockProsperity: 0 },
  { type: 'duck',    name: 'Gerald',       emoji: '🦆', unlockProsperity: 0 },
  { type: 'dog',     name: 'Biscuit',      emoji: '🐶', unlockProsperity: 0 },
  { type: 'sheep',   name: 'Wooly',        emoji: '🐑', unlockProsperity: 0 },
  { type: 'frog',    name: 'Ribbit',       emoji: '🐸', unlockProsperity: 0 },
  { type: 'chicken', name: 'Nugget',       emoji: '🐔', unlockProsperity: 0 },
  { type: 'horse',   name: 'Clover',       emoji: '🐴', unlockProsperity: 0 },
]

export const STARTER_ANIMAL_TYPES = ANIMAL_TYPE_CONFIGS.filter(a => a.unlockProsperity === 0)

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
