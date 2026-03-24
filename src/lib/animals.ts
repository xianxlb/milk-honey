export type AnimalType = 'cow' | 'pig' | 'duck' | 'raccoon' | 'sheep' | 'frog' | 'chicken' | 'bear'

export const ANIMAL_PRODUCE: Record<AnimalType, { item: string; emoji: string; verb: string }> = {
  cow:     { item: 'milk',     emoji: '🥛', verb: 'gives' },
  pig:     { item: 'honey',    emoji: '🍯', verb: 'shares' },
  duck:    { item: 'feathers', emoji: '🪶', verb: 'drops' },
  raccoon: { item: 'findings', emoji: '🪙', verb: 'discovers' },
  sheep:   { item: 'wool',     emoji: '🧶', verb: 'sheds' },
  frog:    { item: 'dewdrops', emoji: '💧', verb: 'collects' },
  chicken: { item: 'eggs',     emoji: '🥚', verb: 'lays' },
  bear:    { item: 'berries',  emoji: '🫐', verb: 'forages' },
}

export interface AnimalVisuals {
  bodyColor: string
  outlineColor: string
  accentColor: string
  blushColor: string
  bgGradient: [string, string]
}

export interface AnimalConfig {
  type: AnimalType
  name: string
  personality: string
  emoji: string
  dialogue: [string, string, string, string, string, string, string, string]
  visuals: AnimalVisuals
}

export const ANIMAL_TYPES: AnimalConfig[] = [
  {
    type: 'cow',
    name: 'Maple',
    personality: "Born without the self-doubt gene. Cape stays on.",
    emoji: '🐄',
    visuals: { bodyColor: '#F5F0E8', outlineColor: '#C4A882', accentColor: '#CB8F66', blushColor: '#F4A6A0', bgGradient: ['#FFEFC5', '#F5F0E8'] },
    dialogue: [
      "We'll figure it out when we get there.",
      "The cape stays on. Non-negotiable.",
      "Zero reconnaissance. Full commitment.",
      "It worked out. I knew it would. Roughly.",
      "High risk, non-zero returns. That's the strategy.",
      "I look good in the cape. That's sufficient.",
      "It usually works out. Mostly. The cape helps.",
      "Born without the self-doubt gene. Can confirm.",
    ],
  },
  {
    type: 'pig',
    name: 'Sir Reginald',
    personality: "Self-appointed aristocrat. Means well. Lands sideways.",
    emoji: '🐷',
    visuals: { bodyColor: '#F8C4C8', outlineColor: '#D4868B', accentColor: '#F4A6A0', blushColor: '#F4A6A0', bgGradient: ['#FFF0F2', '#F8C4C8'] },
    dialogue: [
      "I meant to do that.",
      "The monocle is prescription. Also decorative.",
      "One must maintain standards. *tips hat into puddle*",
      "I have rallied the group. The cause is still being determined.",
      "A gentleman recovers with grace. *recovers with very little grace*",
      "The embarrassment is strategic. Everything is strategic.",
      "The records confirming my greatness are... unavailable.",
      "Distinguished. Absolutely distinguished. *adjusts too-small hat*",
    ],
  },
  {
    type: 'duck',
    name: 'Gerald',
    personality: "Permanent holiday energy. Parcels arrive eventually.",
    emoji: '🦆',
    visuals: { bodyColor: '#F8E27A', outlineColor: '#C8A030', accentColor: '#F0A830', blushColor: '#F4A6A0', bgGradient: ['#FFF8D6', '#F8E27A'] },
    dialogue: [
      "It'll get there.",
      "Waddling is not slowness. It's pace.",
      "Urgency is a personal choice. I've opted out.",
      "The parcel will arrive. In good time.",
      "I found the best spot. Don't ask how. Just sit.",
      "Most well-travelled. Gone nowhere in particular. Highly recommend.",
      "The timeline is mine. The route is scenic. The parcel is fine.",
      "Unbothered. Well-located. Parcel situation: handled.",
    ],
  },
  {
    type: 'raccoon',
    name: 'Remy',
    personality: "Urban entrepreneur. Legally grey. Has an arrangement.",
    emoji: '🦝',
    visuals: { bodyColor: '#A8A8A8', outlineColor: '#787878', accentColor: '#5C5C5C', blushColor: '#F4A6A0', bgGradient: ['#E8E8E8', '#D0D0D0'] },
    dialogue: [
      "I know a guy.",
      "I found something. It's fine. Don't ask where.",
      "I have an arrangement. Details are confidential.",
      "Business opportunity. Very exciting. Loosely legal.",
      "I brought snacks. Origin: undisclosed.",
      "I have information. Source: also undisclosed.",
      "The pitch makes sense eventually. Trust the process.",
      "Means well. Results vary. The snacks are good though.",
    ],
  },
  {
    type: 'sheep',
    name: 'Wooly',
    personality: "Den mother. Gossip oracle. Tea is her love language.",
    emoji: '🐑',
    visuals: { bodyColor: '#F5F0E8', outlineColor: '#B8A8C0', accentColor: '#D0D3EB', blushColor: '#F4A6A0', bgGradient: ['#F0ECF8', '#D0D3EB'] },
    dialogue: [
      "Come, sit. I'll put the kettle on.",
      "Tea is tea - both herbal or verbal.",
      "I had a feeling this would happen. I brewed for it.",
      "Seventeen scarves. Still cold. The tea helps.",
      "I already know. The tea told me.",
      "Half of it's fixed already. Don't mention it.",
      "Everyone talks to me eventually. I never judge. Out loud.",
      "I know things. Some were told. Some I just... knew.",
    ],
  },
  {
    type: 'frog',
    name: 'Ribbit',
    personality: "Chaos as performance. Clown suit is a lifestyle.",
    emoji: '🐸',
    visuals: { bodyColor: '#7BC47F', outlineColor: '#4A9050', accentColor: '#5AA85E', blushColor: '#F4A6A0', bgGradient: ['#E0F5E2', '#B8E0BA'] },
    dialogue: [
      "Was that not what was supposed to happen?",
      "The clown suit is not a costume. It's a calling.",
      "Banned from two county fairs. Both bans were deeply unfair.",
      "Nugget disapproves. I consider this a compliment.",
      "Chaos is performance. I'm always performing.",
      "Deeply delighted. By everything. Especially this.",
      "*falls off ball* Intentional. Very intentional.",
      "Energy: unpredictable. Intentions: good. Results: anyone's guess.",
    ],
  },
  {
    type: 'chicken',
    name: 'Nugget',
    personality: "The eldest. Has seen things. Shows up anyway.",
    emoji: '🐔',
    visuals: { bodyColor: '#F8E27A', outlineColor: '#C8A030', accentColor: '#F0A830', blushColor: '#F4A6A0', bgGradient: ['#FFF8D6', '#F5F0E8'] },
    dialogue: [
      "I'm not saying I told you so. I'm just standing here.",
      "My back hurts. I'm here anyway.",
      "*meaningful squinting*",
      "I disapprove. I came regardless.",
      "I've seen things. Ask me nothing.",
      "Patience ran out years ago. Showing up did not.",
      "Wooly told me. I pretended not to care. I cared.",
      "The eldest. Has seen things. Back still hurts.",
    ],
  },
  {
    type: 'bear',
    name: 'Bruno',
    personality: "Smol runt of a big family. Emotional anchor. Extremely hungry.",
    emoji: '🐻',
    visuals: { bodyColor: '#CB8F66', outlineColor: '#9A6840', accentColor: '#A67040', blushColor: '#F4A6A0', bgGradient: ['#F5E6D8', '#E0C8A8'] },
    dialogue: [
      "Is there more?",
      "Nap first. Then food. Then the thing.",
      "Smol. But present. Mostly just hungry.",
      "When I'm calm, everything's manageable. I'm calm.",
      "My family is enormous. I am the runt. I don't mind.",
      "Simple joys: food, warmth, good company, more food.",
      "The napping is competitive. I'm ranked.",
      "Full and rested. Everything's better now.",
    ],
  },
]

export function getAnimalConfig(type: AnimalType): AnimalConfig {
  const config = ANIMAL_TYPES.find(a => a.type === type)
  if (!config) throw new Error(`Unknown animal type: ${type}`)
  return config
}

export function getAnimalDialogue(type: AnimalType, level: number): string {
  const config = getAnimalConfig(type)
  return config.dialogue[Math.max(0, Math.min(7, level - 1))]
}

export function getAnimalName(type: AnimalType): string {
  return getAnimalConfig(type).name
}

export function getAnimalPersonality(type: AnimalType): string {
  return getAnimalConfig(type).personality
}
