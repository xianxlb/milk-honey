import type { AnimalSvgProps } from './AnimalIllustration'

const O = '#B8A8C0'
const WOOL = '#F5F0E8'
const FACE = '#F8EAE0'
const BLUSH = '#F4A6A0'

export function SheepSvg({ size = 200, expression = 'neutral', className = '', animate = true }: AnimalSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={`${animate ? 'animal-bob' : ''} ${className}`}>
      {/* Wool cloud - head */}
      <circle cx={72} cy={42} r={14} fill={WOOL} stroke={O} strokeWidth={3} />
      <circle cx={100} cy={34} r={16} fill={WOOL} stroke={O} strokeWidth={3} />
      <circle cx={128} cy={42} r={14} fill={WOOL} stroke={O} strokeWidth={3} />
      <circle cx={60} cy={58} r={12} fill={WOOL} stroke={O} strokeWidth={3} />
      <circle cx={140} cy={58} r={12} fill={WOOL} stroke={O} strokeWidth={3} />
      {/* Face */}
      <ellipse cx={100} cy={82} rx={36} ry={32} fill={FACE} stroke={O} strokeWidth={3.5} />
      {/* Ears */}
      <ellipse cx={62} cy={78} rx={10} ry={7} fill={FACE} stroke={O} strokeWidth={2.5} transform="rotate(-10 62 78)" />
      <ellipse cx={138} cy={78} rx={10} ry={7} fill={FACE} stroke={O} strokeWidth={2.5} transform="rotate(10 138 78)" />
      {/* Eyes */}
      {expression === 'sleeping' ? (
        <>
          <path d="M84 78 Q88 74 92 78" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M108 78 Q112 74 116 78" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : expression === 'happy' || expression === 'celebrating' ? (
        <>
          <path d="M84 80 Q88 74 92 80" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M108 80 Q112 74 116 80" stroke={O} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={88} cy={78} r={3} fill="#5A4A5A" />
          <circle cx={112} cy={78} r={3} fill="#5A4A5A" />
        </>
      )}
      {/* Blush */}
      <ellipse cx={76} cy={90} rx={7} ry={4} fill={BLUSH} opacity={0.5} />
      <ellipse cx={124} cy={90} rx={7} ry={4} fill={BLUSH} opacity={0.5} />
      {/* Nose */}
      <ellipse cx={100} cy={90} rx={4} ry={3} fill="#D0A8A0" />
      {/* Mouth */}
      {(expression === 'happy' || expression === 'celebrating') ? (
        <path d="M94 97 Q100 103 106 97" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      ) : (
        <path d="M96 97 Q100 100 104 97" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      )}
      {/* Wool body - cloud puffs */}
      <circle cx={70} cy={126} r={16} fill={WOOL} stroke={O} strokeWidth={3} />
      <circle cx={100} cy={122} r={20} fill={WOOL} stroke={O} strokeWidth={3} />
      <circle cx={130} cy={126} r={16} fill={WOOL} stroke={O} strokeWidth={3} />
      <circle cx={78} cy={148} r={14} fill={WOOL} stroke={O} strokeWidth={3} />
      <circle cx={100} cy={150} r={18} fill={WOOL} stroke={O} strokeWidth={3} />
      <circle cx={122} cy={148} r={14} fill={WOOL} stroke={O} strokeWidth={3} />
      {/* Stubby legs */}
      <ellipse cx={80} cy={170} rx={8} ry={6} fill={FACE} stroke={O} strokeWidth={2.5} />
      <ellipse cx={120} cy={170} rx={8} ry={6} fill={FACE} stroke={O} strokeWidth={2.5} />
      {/* Tea cup */}
      <path d="M52 168 L50 180 Q52 184 60 184 L62 172Z" fill="#D0D3EB" stroke={O} strokeWidth={2} strokeLinejoin="round" />
      <path d="M62 174 Q66 174 66 178 Q66 182 62 181" stroke={O} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {/* Steam */}
      <path d="M54 166 Q52 161 55 157" stroke="#D0D3EB" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.5} />
    </svg>
  )
}
