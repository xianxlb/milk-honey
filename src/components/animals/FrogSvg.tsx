import type { AnimalSvgProps } from './AnimalIllustration'

const O = '#4A9050'
const BODY = '#7BC47F'
const BELLY = '#B8E8B0'
const BLUSH = '#F4A6A0'

export function FrogSvg({ size = 200, expression = 'neutral', className = '', animate = true }: AnimalSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={`${animate ? 'animal-bob' : ''} ${className}`}>
      {/* Big round eyes on top */}
      <circle cx={76} cy={42} r={18} fill={BODY} stroke={O} strokeWidth={3.5} />
      <circle cx={76} cy={42} r={12} fill="#E8F5E0" />
      <circle cx={124} cy={42} r={18} fill={BODY} stroke={O} strokeWidth={3.5} />
      <circle cx={124} cy={42} r={12} fill="#E8F5E0" />
      {/* Eye pupils */}
      {expression === 'sleeping' ? (
        <>
          <path d="M70 44 Q76 40 82 44" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M118 44 Q124 40 130 44" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : expression === 'happy' || expression === 'celebrating' ? (
        <>
          <path d="M70 44 Q76 38 82 44" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M118 44 Q124 38 130 44" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={76} cy={44} r={5} fill="#1A3A1A" />
          <circle cx={78} cy={42} r={1.5} fill="white" />
          <circle cx={124} cy={44} r={5} fill="#1A3A1A" />
          <circle cx={126} cy={42} r={1.5} fill="white" />
        </>
      )}
      {/* Head */}
      <ellipse cx={100} cy={80} rx={48} ry={38} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Blush */}
      <ellipse cx={68} cy={86} rx={8} ry={5} fill={BLUSH} opacity={0.45} />
      <ellipse cx={132} cy={86} rx={8} ry={5} fill={BLUSH} opacity={0.45} />
      {/* Nostrils */}
      <circle cx={92} cy={80} r={2} fill="#5AA85E" />
      <circle cx={108} cy={80} r={2} fill="#5AA85E" />
      {/* Wide frog smile */}
      {(expression === 'happy' || expression === 'celebrating') ? (
        <path d="M78 92 Q100 108 122 92" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      ) : (
        <path d="M82 92 Q100 104 118 92" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      )}
      {/* Body - round blob */}
      <ellipse cx={100} cy={148} rx={40} ry={36} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Belly */}
      <ellipse cx={100} cy={152} rx={28} ry={24} fill={BELLY} />
      {/* Stubby arms with webbed fingers */}
      <ellipse cx={58} cy={140} rx={12} ry={8} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(-15 58 140)" />
      <ellipse cx={142} cy={140} rx={12} ry={8} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(15 142 140)" />
      {/* Stubby legs */}
      <ellipse cx={80} cy={180} rx={12} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
      <ellipse cx={120} cy={180} rx={12} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
      {/* Tiny red nose (clown!) */}
      <circle cx={100} cy={78} r={6} fill="#E88888" stroke="#D07070" strokeWidth={2} />
    </svg>
  )
}
