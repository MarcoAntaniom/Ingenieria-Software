const TONES = {
  neutral: 'bg-subtle text-muted',
  info: 'bg-secondary-container text-on-secondary-container',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger-strong',
}

export default function StatusBadge({ children, tone = 'neutral' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${TONES[tone] || TONES.neutral}`}
    >
      {children}
    </span>
  )
}
