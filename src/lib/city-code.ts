const ADJECTIVES = [
  'amber', 'azure', 'brass', 'cedar', 'coral', 'crimson', 'dusk', 'ember',
  'fern', 'flint', 'frost', 'gilded', 'golden', 'granite', 'haven', 'honey',
  'ivory', 'jade', 'jasper', 'linen', 'lunar', 'maple', 'marble', 'meadow',
  'mellow', 'misty', 'mossy', 'oaken', 'ochre', 'olive', 'onyx', 'opal',
  'pebble', 'pewter', 'pine', 'quiet', 'rose', 'ruby', 'russet', 'sage',
  'sandy', 'scarlet', 'silver', 'slate', 'smoky', 'snow', 'solar', 'stone',
  'sunny', 'tawny', 'teal', 'timber', 'vale', 'velvet', 'violet', 'willow',
  'wren', 'ashen', 'birch', 'calm', 'dew', 'dusky', 'ferny', 'glade',
]

const NOUNS = [
  'brook', 'canyon', 'cave', 'cliff', 'coast', 'creek', 'dale', 'dell',
  'dune', 'falls', 'fjord', 'forest', 'glade', 'glen', 'gorge', 'grove',
  'harbor', 'haven', 'heath', 'hill', 'hollow', 'inlet', 'isle', 'knoll',
  'lagoon', 'lake', 'lantern', 'ledge', 'marsh', 'meadow', 'mesa', 'mill',
  'moor', 'mount', 'peak', 'pine', 'plain', 'pond', 'prairie', 'reef',
  'ridge', 'river', 'rock', 'shore', 'slope', 'spring', 'stone', 'stream',
  'summit', 'swamp', 'thicket', 'tide', 'timber', 'trail', 'vale', 'valley',
  'village', 'vista', 'waters', 'weald', 'well', 'wetland', 'wood', 'woods',
]

export function generateCityCode(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${adj}-${noun}-${num}`
}
