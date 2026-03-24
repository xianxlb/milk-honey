import type { AnimalSvgProps } from './AnimalIllustration'

const O = '#C4A882' // colored outline
const BODY = '#F5F0E8'
const SPOT = '#CB8F66'
const BLUSH = '#F4A6A0'

export function CowSvg({ size = 200, expression = 'neutral', className = '', animate = true }: AnimalSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={`${animate ? 'animal-bob' : ''} ${className}`}>
      {/* Horns */}
      <ellipse cx={68} cy={38} rx={8} ry={14} fill="#F8D888" stroke={O} strokeWidth={3.5} transform="rotate(-10 68 38)" />
      <ellipse cx={132} cy={38} rx={8} ry={14} fill="#F8D888" stroke={O} strokeWidth={3.5} transform="rotate(10 132 38)" />
      {/* Ears */}
      <ellipse cx={48} cy={68} rx={16} ry={10} fill={BODY} stroke={O} strokeWidth={3.5} transform="rotate(-20 48 68)" />
      <ellipse cx={48} cy={68} rx={10} ry={6} fill={BLUSH} opacity={0.5} transform="rotate(-20 48 68)" />
      <ellipse cx={152} cy={68} rx={16} ry={10} fill={BODY} stroke={O} strokeWidth={3.5} transform="rotate(20 152 68)" />
      <ellipse cx={152} cy={68} rx={10} ry={6} fill={BLUSH} opacity={0.5} transform="rotate(20 152 68)" />
      {/* Head - large round */}
      <circle cx={100} cy={82} r={48} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Spots */}
      <circle cx={72} cy={66} r={12} fill={SPOT} opacity={0.35} />
      <circle cx={128} cy={74} r={9} fill={SPOT} opacity={0.35} />
      {/* Eyes */}
      {expression === 'sleeping' ? (
        <>
          <path d="M82 80 Q86 76 90 80" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M110 80 Q114 76 118 80" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : expression === 'happy' || expression === 'celebrating' ? (
        <>
          <path d="M82 82 Q86 76 90 82" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M110 82 Q114 76 118 82" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={86} cy={80} r={3.5} fill="#4A3728" />
          <circle cx={114} cy={80} r={3.5} fill="#4A3728" />
        </>
      )}
      {/* Blush */}
      <ellipse cx={72} cy={90} rx={8} ry={5} fill={BLUSH} opacity={0.5} />
      <ellipse cx={128} cy={90} rx={8} ry={5} fill={BLUSH} opacity={0.5} />
      {/* Snout */}
      <ellipse cx={100} cy={96} rx={14} ry={10} fill="#F0E0C8" stroke={O} strokeWidth={2.5} />
      <circle cx={95} cy={95} r={2.5} fill={O} />
      <circle cx={105} cy={95} r={2.5} fill={O} />
      {/* Mouth */}
      {(expression === 'happy' || expression === 'celebrating') ? (
        <path d="M95 102 Q100 107 105 102" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      ) : (
        <path d="M96 101 Q100 104 104 101" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      )}
      {/* Body - round blob */}
      <ellipse cx={100} cy={150} rx={40} ry={36} fill={BODY} stroke={O} strokeWidth={3.5} />
      <circle cx={112} cy={148} r={12} fill={SPOT} opacity={0.3} />
      {/* Stubby arms */}
      <ellipse cx={62} cy={142} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(-25 62 142)" />
      <ellipse cx={138} cy={142} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(25 138 142)" />
      {/* Stubby legs */}
      <ellipse cx={82} cy={182} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
      <ellipse cx={118} cy={182} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
      {/* Tiny cape hint */}
      <path d="M68 132 Q64 145 60 155 Q58 158 62 157 L68 140Z" fill="#E88888" stroke="#D07070" strokeWidth={2} strokeLinejoin="round" />
      <path d="M132 132 Q136 145 140 155 Q142 158 138 157 L132 140Z" fill="#E88888" stroke="#D07070" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}
