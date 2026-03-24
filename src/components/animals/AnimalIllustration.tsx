import type { AnimalType } from '@/lib/animals'
import { CowSvg } from './CowSvg'
import { PigSvg } from './PigSvg'
import { DuckSvg } from './DuckSvg'
import { RaccoonSvg } from './RaccoonSvg'
import { SheepSvg } from './SheepSvg'
import { FrogSvg } from './FrogSvg'
import { ChickenSvg } from './ChickenSvg'
import { BearSvg } from './BearSvg'
import type { ComponentType } from 'react'

export interface AnimalSvgProps {
  size?: number
  expression?: 'neutral' | 'happy' | 'sleeping' | 'eating' | 'celebrating'
  level?: number
  className?: string
  animate?: boolean
}

export interface AnimalIllustrationProps extends AnimalSvgProps {
  animalType: AnimalType
}

const ANIMAL_COMPONENTS: Record<AnimalType, ComponentType<AnimalSvgProps>> = {
  cow: CowSvg,
  pig: PigSvg,
  duck: DuckSvg,
  raccoon: RaccoonSvg,
  sheep: SheepSvg,
  frog: FrogSvg,
  chicken: ChickenSvg,
  bear: BearSvg,
}

export function AnimalIllustration({ animalType, ...props }: AnimalIllustrationProps) {
  const Component = ANIMAL_COMPONENTS[animalType]
  if (!Component) return null
  return <Component {...props} />
}
