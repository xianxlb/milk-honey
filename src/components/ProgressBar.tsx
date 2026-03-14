interface ProgressBarProps {
  current: number
  target: number
  label?: string
  className?: string
}

export default function ProgressBar({ current, target, label, className }: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100)
  return (
    <div className={className}>
      {label && <p className="text-xs text-gray-500 mb-1">{label}</p>}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        ${current.toFixed(2)} / ${target.toFixed(2)}
      </p>
    </div>
  )
}
