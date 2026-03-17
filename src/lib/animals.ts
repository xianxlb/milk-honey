export type AnimalType = 'cow' | 'pig' | 'duck' | 'dog' | 'sheep' | 'frog' | 'chicken' | 'horse'

export interface AnimalConfig {
  type: AnimalType
  name: string
  personality: string
  emoji: string
  dialogue: [string, string, string, string, string, string, string, string]
}

export const ANIMAL_TYPES: AnimalConfig[] = [
  {
    type: 'cow',
    name: 'Bessie',
    personality: "Rebel. Doesn't follow rules.",
    emoji: '🐄',
    dialogue: [
      "Rules? Never heard of them.",
      "My scooter goes faster than your scooter.",
      "I read the terms. I disagree with all of them.",
      "I cape, therefore I am.",
      "They said I couldn't. That was motivating.",
      "The rulebook? Great coaster.",
      "I have opinions about speed limits.",
      "Legendary. It's a whole thing.",
    ],
  },
  {
    type: 'pig',
    name: 'Sir Reginald',
    personality: "Distinguished gentleman. Hopelessly clumsy.",
    emoji: '🐷',
    dialogue: [
      "One must maintain standards. *trips*",
      "The monocle is prescription. Also decorative.",
      "I assure you this is entirely intentional.",
      "A gentleman recovers with grace. *tips hat into puddle*",
      "Dignity is a state of mind. Mine is fine.",
      "The top hat improves my balance. Marginally.",
      "I have fallen upward. It's a technique.",
      "Distinguished. Absolutely distinguished.",
    ],
  },
  {
    type: 'duck',
    name: 'Gerald',
    personality: "Assigned as delivery duck. Delivers only on foot.",
    emoji: '🦆',
    dialogue: [
      "I am on vacation. Also your package.",
      "Waddling is faster than it looks.",
      "ETA: whenever. I'm on beach time.",
      "The delivery window is 'eventually'.",
      "I took the scenic route. Twice.",
      "Your package is safe. I sat on it briefly.",
      "Five stars. Rate me five stars.",
      "Gerald Delivers™. Mostly.",
    ],
  },
  {
    type: 'dog',
    name: 'Biscuit',
    personality: "Terrified of humans. Communicates via whiteboard only.",
    emoji: '🐶',
    dialogue: [
      "*holds up whiteboard* hi",
      "*erases and rewrites* this is fine",
      "*whiteboard* please do not look directly at me",
      "*writes slowly* i am brave actually",
      "*whiteboard* everything is okay. check back later.",
      "*extensive diagram* i am doing well",
      "*whiteboard* humans aren't so bad I guess",
      "*writes in big letters* BISCUIT",
    ],
  },
  {
    type: 'sheep',
    name: 'Wooly',
    personality: "Always freezing. Constantly bundled up, always has a hot drink.",
    emoji: '🐑',
    dialogue: [
      "It's cold. *sips cocoa*",
      "The wool doesn't help, actually.",
      "This is my third sweater. Still cold.",
      "Hot drink number four. Still.",
      "They said summer would come. I have my doubts.",
      "Six layers. Progress.",
      "I made peace with the cold. The cold did not reciprocate.",
      "Warm on the inside. Barely. *sips*",
    ],
  },
  {
    type: 'frog',
    name: 'Ribbit',
    personality: "Clown suit. Balances on a ball. Laughs at own jokes.",
    emoji: '🐸',
    dialogue: [
      "Why did the frog cross the road? Because I DID! *laughs*",
      "*falls off ball* nailed it",
      "My jokes are critically acclaimed. By me.",
      "Ribbit ribbit! That's the whole bit! *honks horn*",
      "I'm on a roll. Literally. *rolls by*",
      "Comedy is my passion and also my calling and also my job.",
      "The funniest frog in the known world. I checked.",
      "STANDING OVATION. *claps own flippers*",
    ],
  },
  {
    type: 'chicken',
    name: 'Nugget',
    personality: "Small. Angry. Has back pain.",
    emoji: '🐔',
    dialogue: [
      "My back hurts.",
      "Don't ask. Back.",
      "Small but furious.",
      "I am fine. My back is not fine.",
      "The indignity of it all.",
      "Nugget does not forget.",
      "I have been through things.",
      "Respect. Immediately.",
    ],
  },
  {
    type: 'horse',
    name: 'Clover',
    personality: "Zero willpower around sweet treats.",
    emoji: '🐴',
    dialogue: [
      "I said I wouldn't. *eats sugar cube*",
      "One more. Just one more.",
      "This is the last one. I mean it this time.",
      "I have no regrets. I have many regrets.",
      "The treats find me. I don't seek them out. They find me.",
      "Willpower is overrated, actually.",
      "I made a deal with myself. I broke it immediately.",
      "Sweet. Everything is sweet. Life is sweet. *eats another*",
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
