import type { AnimalSvgProps } from './AnimalIllustration'

const O = '#C8A030'
const BODY = '#F8E27A'
const BELLY = '#FFF5D6'
const BLUSH = '#F4A6A0'

export function ChickenSvg({ size = 200, expression = 'neutral', className = '', animate = true }: AnimalSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={`${animate ? 'animal-bob' : ''} ${className}`}>
      {/* Comb */}
      <circle cx={92} cy={28} r={8} fill="#E88888" stroke="#D07070" strokeWidth={2} />
      <circle cx={104} cy={24} r={9} fill="#E88888" stroke="#D07070" strokeWidth={2} />
      <circle cx={114} cy={30} r={7} fill="#E88888" stroke="#D07070" strokeWidth={2} />
      {/* Head */}
      <circle cx={100} cy={74} r={44} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Eyes - Nugget squints */}
      {expression === 'sleeping' ? (
        <>
          <path d="M80 72 Q84 68 88 72" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M112 72 Q116 68 120 72" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : expression === 'happy' || expression === 'celebrating' ? (
        <>
          <path d="M80 74 Q84 68 88 74" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M112 74 Q116 68 120 74" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={84} cy={72} r={3} fill="#4A3A18" />
          <circle cx={116} cy={72} r={3} fill="#4A3A18" />
          {/* Squint lines */}
          <path d="M78 68 L90 70" stroke={O} strokeWidth={2} strokeLinecap="round" />
          <path d="M110 70 L122 68" stroke={O} strokeWidth={2} strokeLinecap="round" />
        </>
      )}
      {/* Blush */}
      <ellipse cx={72} cy={84} rx={7} ry={4} fill={BLUSH} opacity={0.5} />
      <ellipse cx={128} cy={84} rx={7} ry={4} fill={BLUSH} opacity={0.5} />
      {/* Beak */}
      <path d="M90 86 L100 96 L110 86Z" fill="#F0A830" stroke={O} strokeWidth={2.5} strokeLinejoin="round" />
      {/* Wattle */}
      <ellipse cx={100} cy={100} rx={5} ry={7} fill="#E88888" stroke="#D07070" strokeWidth={1.5} />
      {/* Body */}
      <ellipse cx={100} cy={148} rx={40} ry={36} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Belly */}
      <ellipse cx={100} cy={152} rx={26} ry={22} fill={BELLY} />
      {/* Stubby wings */}
      <ellipse cx={58} cy={140} rx={12} ry={8} fill="#E8D060" stroke={O} strokeWidth={3} transform="rotate(-15 58 140)" />
      <ellipse cx={142} cy={140} rx={12} ry={8} fill="#E8D060" stroke={O} strokeWidth={3} transform="rotate(15 142 140)" />
      {/* Stubby feet */}
      <ellipse cx={84} cy={182} rx={10} ry={6} fill="#F0A830" stroke={O} strokeWidth={2.5} />
      <ellipse cx={116} cy={182} rx={10} ry={6} fill="#F0A830" stroke={O} strokeWidth={2.5} />
    </svg>
  )
}
