export function ProgressBar({
  value = 0,
  max = 100,
  label = 'Progreso del curso',
  showLabel = true,
  className = '',
  color = '#0B4F6C',
}) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100)

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
          <span className="text-[#4B5563]">{label}</span>
          <span className="text-[#0B4F6C] font-extrabold">{percentage}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
        <div
          aria-label={`${label}: ${percentage}%`}
          aria-valuemax={max}
          aria-valuemin={0}
          aria-valuenow={percentage}
          className="h-full rounded-full transition-all duration-300"
          role="progressbar"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage === 100 ? '#16856A' : color,
          }}
        />
      </div>
    </div>
  )
}
