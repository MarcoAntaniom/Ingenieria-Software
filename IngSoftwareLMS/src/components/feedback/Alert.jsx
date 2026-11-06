export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  action,
  className = '',
}) {
  const variantStyles = {
    info: {
      container: 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1]',
      iconDefault: 'info',
    },
    success: {
      container: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]',
      iconDefault: 'check_circle',
    },
    warning: {
      container: 'border-[#FEF08A] bg-[#FEFCE8] text-[#A16207]',
      iconDefault: 'warning',
    },
    danger: {
      container: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]',
      iconDefault: 'error',
    },
  }

  const current = variantStyles[variant] || variantStyles.info

  return (
    <div
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs sm:text-sm leading-relaxed ${current.container} ${className}`}
      role="alert"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-xl shrink-0 mt-0.5">
        {icon || current.iconDefault}
      </span>
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-bold text-ink mb-0.5">{title}</h4>}
        <div className="font-medium">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
