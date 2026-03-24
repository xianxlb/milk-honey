import type { AnimalSvgProps } from './AnimalIllustration'

const O = '#D4868B'
const BODY = '#F8C4C8'
const BLUSH = '#F4A6A0'

export function PigSvg({ size = 200, expression = 'neutral', className = '', animate = true }: AnimalSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={`${animate ? 'animal-bob' : ''} ${className}`}>
      {/* Ears - floppy triangles */}
      <path d="M60 55 Q48 32 58 38 Q66 42 64 58" fill={BODY} stroke={O} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M140 55 Q152 32 142 38 Q134 42 136 58" fill={BODY} stroke={O} strokeWidth={3.5} strokeLinejoin="round" />
      {/* Head */}
      <circle cx={100} cy={80} r={48} fill={BODY} stroke={O} strokeWidth={3.5} />
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
          <circle cx={84} cy={78} r={3.5} fill="#4A3030" />
          <circle cx={116} cy={78} r={3.5} fill="#4A3030" />
        </>
      )}
      {/* Blush */}
      <ellipse cx={70} cy={90} rx={8} ry={5} fill={BLUSH} opacity={0.6} />
      <ellipse cx={130} cy={90} rx={8} ry={5} fill={BLUSH} opacity={0.6} />
      {/* Snout - big round piggy nose */}
      <ellipse cx={100} cy={94} rx={16} ry={12} fill="#F0B0B4" stroke={O} strokeWidth={2.5} />
      <ellipse cx={94} cy={93} rx={3.5} ry={3} fill="#D89094" />
      <ellipse cx={106} cy={93} rx={3.5} ry={3} fill="#D89094" />
      {/* Mouth */}
      {(expression === 'happy' || expression === 'celebrating') ? (
        <path d="M94 104 Q100 110 106 104" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      ) : (
        <path d="M96 103 Q100 106 104 103" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      )}
      {/* Body */}
      <ellipse cx={100} cy={150} rx={40} ry={36} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Stubby arms */}
      <ellipse cx={62} cy={142} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(-25 62 142)" />
      <ellipse cx={138} cy={142} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(25 138 142)" />
      {/* Stubby legs */}
      <ellipse cx={82} cy={182} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
      <ellipse cx={118} cy={182} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
      {/* Tiny top hat */}
      <rect x={86} y={28} width={28} height={18} rx={3} fill="#6B5B5B" stroke="#5A4A4A" strokeWidth={2} />
      <rect x={80} y={44} width={40} height={6} rx={2} fill="#6B5B5B" stroke="#5A4A4A" strokeWidth={2} />
      <rect x={86} y={40} width={28} height={4} rx={1} fill="#E88888" />
    </svg>
  )
}
