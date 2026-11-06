export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) {
  const variantStyles = {
    neutral: 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
    primary: 'bg-[#E8F3F8] text-[#0B4F6C] border-[#BAE6FD]',
    accent: 'bg-[#E6FAF8] text-[#0D9488] border-[#99F6E4]',
    success: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    warning: 'bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A]',
    danger: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
  }

  const sizeStyles = {
    sm: 'text-[10px] font-bold px-2 py-0.5 rounded-md gap-1',
    md: 'text-[11px] font-bold px-2.5 py-0.5 rounded-lg gap-1.5',
  }

  return (
    <span
      className={`inline-flex items-center border leading-none tracking-normal select-none ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {icon && (
        <span aria-hidden="true" className="material-symbols-outlined text-[13px] shrink-0">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  )
}
