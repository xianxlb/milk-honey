import type { AnimalSvgProps } from './AnimalIllustration'

const O = '#9A6840'
const BODY = '#CB8F66'
const BELLY = '#E8D0B8'
const BLUSH = '#F4A6A0'

export function BearSvg({ size = 200, expression = 'neutral', className = '', animate = true }: AnimalSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={`${animate ? 'animal-bob' : ''} ${className}`}>
      {/* Ears */}
      <circle cx={64} cy={42} r={16} fill={BODY} stroke={O} strokeWidth={3.5} />
      <circle cx={64} cy={42} r={9} fill={BELLY} />
      <circle cx={136} cy={42} r={16} fill={BODY} stroke={O} strokeWidth={3.5} />
      <circle cx={136} cy={42} r={9} fill={BELLY} />
      {/* Head */}
      <circle cx={100} cy={80} r={46} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Eyes */}
      {expression === 'sleeping' ? (
        <>
          <path d="M80 78 Q84 74 88 78" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M112 78 Q116 74 120 78" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : expression === 'happy' || expression === 'celebrating' ? (
        <>
          <path d="M80 80 Q84 74 88 80" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M112 80 Q116 74 120 80" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={84} cy={78} r={3.5} fill="#3A2818" />
          <circle cx={116} cy={78} r={3.5} fill="#3A2818" />
        </>
      )}
      {/* Blush */}
      <ellipse cx={70} cy={90} rx={8} ry={5} fill={BLUSH} opacity={0.5} />
      <ellipse cx={130} cy={90} rx={8} ry={5} fill={BLUSH} opacity={0.5} />
      {/* Muzzle */}
      <ellipse cx={100} cy={94} rx={18} ry={14} fill={BELLY} stroke={O} strokeWidth={2.5} />
      {/* Nose */}
      <ellipse cx={100} cy={90} rx={6} ry={4} fill={O} />
      {/* Mouth */}
      {(expression === 'happy' || expression === 'celebrating') ? (
        <path d="M93 100 Q100 107 107 100" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      ) : expression === 'eating' ? (
        <ellipse cx={100} cy={102} rx={4} ry={5} fill={O} />
      ) : (
        <path d="M95 100 Q100 104 105 100" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      )}
      {/* Body - chubby blob */}
      <ellipse cx={100} cy={150} rx={40} ry={36} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Belly */}
      <ellipse cx={100} cy={154} rx={26} ry={22} fill={BELLY} />
      {/* Stubby arms reaching out */}
      <ellipse cx={60} cy={140} rx={12} ry={8} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(-20 60 140)" />
      <ellipse cx={140} cy={140} rx={12} ry={8} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(20 140 140)" />
      {/* Tote bag */}
      <rect x={55} y={146} width={16} height={14} rx={3} fill="#D4B878" stroke={O} strokeWidth={2} />
      <path d="M58 146 L58 142 Q63 138 68 142 L68 146" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Stubby legs */}
      <ellipse cx={82} cy={182} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
      <ellipse cx={118} cy={182} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
    </svg>
  )
}
