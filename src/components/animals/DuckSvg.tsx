import type { AnimalSvgProps } from './AnimalIllustration'

const O = '#C8A030'
const BODY = '#F8E27A'
const BLUSH = '#F4A6A0'
const BELLY = '#FFF5D6'

export function DuckSvg({ size = 200, expression = 'neutral', className = '', animate = true }: AnimalSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={`${animate ? 'animal-bob' : ''} ${className}`}>
      {/* Straw hat */}
      <ellipse cx={100} cy={40} rx={42} ry={8} fill="#E8D098" stroke={O} strokeWidth={2.5} />
      <path d="M74 40 Q74 18 100 16 Q126 18 126 40" fill="#F0DC98" stroke={O} strokeWidth={2.5} />
      <rect x={78} y={32} width={44} height={4} rx={1.5} fill="#D4B878" />
      {/* Head */}
      <circle cx={100} cy={78} r={44} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Eyes */}
      {expression === 'sleeping' ? (
        <>
          <path d="M82 74 Q86 70 90 74" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M110 74 Q114 70 118 74" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : expression === 'happy' || expression === 'celebrating' ? (
        <>
          <path d="M82 76 Q86 70 90 76" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M110 76 Q114 70 118 76" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={86} cy={74} r={3.5} fill="#4A3A18" />
          <circle cx={114} cy={74} r={3.5} fill="#4A3A18" />
        </>
      )}
      {/* Blush */}
      <ellipse cx={72} cy={86} rx={8} ry={5} fill={BLUSH} opacity={0.5} />
      <ellipse cx={128} cy={86} rx={8} ry={5} fill={BLUSH} opacity={0.5} />
      {/* Beak */}
      <ellipse cx={100} cy={92} rx={16} ry={10} fill="#F0A830" stroke={O} strokeWidth={2.5} />
      <path d="M88 91 Q100 95 112 91" stroke="#D89020" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {/* Body - round blob */}
      <ellipse cx={100} cy={148} rx={40} ry={36} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Belly */}
      <ellipse cx={100} cy={152} rx={26} ry={22} fill={BELLY} />
      {/* Stubby wings */}
      <ellipse cx={58} cy={140} rx={12} ry={8} fill="#E8D060" stroke={O} strokeWidth={3} transform="rotate(-15 58 140)" />
      <ellipse cx={142} cy={140} rx={12} ry={8} fill="#E8D060" stroke={O} strokeWidth={3} transform="rotate(15 142 140)" />
      {/* Parcel under wing */}
      <rect x={134} y={148} width={14} height={12} rx={2} fill="#D4B078" stroke={O} strokeWidth={2} />
      <path d="M136 154 L146 154 M141 149 L141 159" stroke={O} strokeWidth={1.5} strokeLinecap="round" />
      {/* Stubby feet */}
      <ellipse cx={84} cy={182} rx={10} ry={6} fill="#F0A830" stroke={O} strokeWidth={2.5} />
      <ellipse cx={116} cy={182} rx={10} ry={6} fill="#F0A830" stroke={O} strokeWidth={2.5} />
    </svg>
  )
}
