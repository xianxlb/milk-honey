import type { AnimalSvgProps } from './AnimalIllustration'

const O = '#787878'
const BODY = '#A8A8A8'
const DARK = '#686868'
const BELLY = '#D8D8D8'
const BLUSH = '#F4A6A0'

export function RaccoonSvg({ size = 200, expression = 'neutral', className = '', animate = true }: AnimalSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={`${animate ? 'animal-bob' : ''} ${className}`}>
      {/* Ears */}
      <circle cx={64} cy={42} r={16} fill={BODY} stroke={O} strokeWidth={3.5} />
      <circle cx={64} cy={42} r={9} fill={DARK} />
      <circle cx={136} cy={42} r={16} fill={BODY} stroke={O} strokeWidth={3.5} />
      <circle cx={136} cy={42} r={9} fill={DARK} />
      {/* Head */}
      <circle cx={100} cy={80} r={46} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Eye mask */}
      <ellipse cx={82} cy={76} rx={16} ry={10} fill={DARK} />
      <ellipse cx={118} cy={76} rx={16} ry={10} fill={DARK} />
      {/* Eyes - white on dark mask */}
      {expression === 'sleeping' ? (
        <>
          <path d="M78 76 Q82 72 86 76" stroke="#E8E8E8" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M114 76 Q118 72 122 76" stroke="#E8E8E8" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : expression === 'happy' || expression === 'celebrating' ? (
        <>
          <path d="M78 78 Q82 72 86 78" stroke="#E8E8E8" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M114 78 Q118 72 122 78" stroke="#E8E8E8" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={82} cy={76} r={3.5} fill="#E8E8E8" />
          <circle cx={118} cy={76} r={3.5} fill="#E8E8E8" />
        </>
      )}
      {/* Nose stripe */}
      <path d="M100 58 L100 86" stroke={BELLY} strokeWidth={5} strokeLinecap="round" />
      {/* Nose */}
      <ellipse cx={100} cy={88} rx={6} ry={4.5} fill={DARK} />
      {/* Blush */}
      <ellipse cx={72} cy={92} rx={7} ry={4} fill={BLUSH} opacity={0.45} />
      <ellipse cx={128} cy={92} rx={7} ry={4} fill={BLUSH} opacity={0.45} />
      {/* Mouth */}
      {(expression === 'happy' || expression === 'celebrating') ? (
        <path d="M94 96 Q100 102 106 96" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      ) : (
        <path d="M96 96 Q100 99 104 96" stroke={O} strokeWidth={2} fill="none" strokeLinecap="round" />
      )}
      {/* Body */}
      <ellipse cx={100} cy={150} rx={38} ry={34} fill={BODY} stroke={O} strokeWidth={3.5} />
      {/* Belly */}
      <ellipse cx={100} cy={154} rx={24} ry={20} fill={BELLY} />
      {/* Stubby arms */}
      <ellipse cx={64} cy={142} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(-25 64 142)" />
      <ellipse cx={136} cy={142} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} transform="rotate(25 136 142)" />
      {/* Bindle stick */}
      <line x1={130} y1={120} x2={148} y2={100} stroke="#A08060" strokeWidth={3} strokeLinecap="round" />
      <circle cx={150} cy={96} r={10} fill="#D4B078" stroke="#A08060" strokeWidth={2} />
      {/* Stubby legs */}
      <ellipse cx={82} cy={180} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
      <ellipse cx={118} cy={180} rx={10} ry={7} fill={BODY} stroke={O} strokeWidth={3} />
      {/* Striped tail */}
      <path d="M138 168 Q152 164 156 152 Q158 144 154 138" stroke={DARK} strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M140 166 Q150 162 154 154" stroke={BODY} strokeWidth={5} fill="none" strokeLinecap="round" />
    </svg>
  )
}
