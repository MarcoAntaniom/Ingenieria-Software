export function ProgressBar({
  value = 0,
  max = 100,
  label = 'Progreso del curso',
  showLabel = true,
  className = '',
  color,
}) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100)

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white">
            {label}
          </span>
          <span className="font-bold tabular-nums text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00F084]">
            {percentage}%
          </span>
        </div>
      )}
      {/* Track accesible de 6px de alto: #2A3A52 en modo oscuro, negro con borde gris en contraste alto */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#2A3A52] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#A6A6A6]">
        <div
          aria-label={`${label}: ${percentage}%`}
          aria-valuemax={max}
          aria-valuemin={0}
          aria-valuenow={percentage}
          className={`h-full rounded-full transition-all duration-300 ${
            percentage === 100
              ? 'bg-[#067647] dark:bg-[#6EE7B7] [data-theme=contrast]_&:bg-[#00F084]'
              : 'bg-[#0B5575] dark:bg-[#2DD4BF] [data-theme=contrast]_&:bg-[#00F084]'
          }`}
          role="progressbar"
          style={{
            width: `${percentage}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
