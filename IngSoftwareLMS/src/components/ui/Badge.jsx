export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  showIcon = true,
  className = '',
}) {
  const variantStyles = {
    neutral:
      'bg-[#F1F5F9] text-[#1E293B] border-[#CBD5E1] dark:bg-[#16243A] dark:text-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:bg-[#1A1A1A] [data-theme=contrast]_&:text-white [data-theme=contrast]_&:border-[#A6A6A6]',
    primary:
      'bg-[#EFF8FB] text-[#0B5575] border-[#BAE6FD] dark:bg-[#123B49] dark:text-[#67E8F9] dark:border-[#0E7490] [data-theme=contrast]_&:bg-[#66D9FF] [data-theme=contrast]_&:text-black [data-theme=contrast]_&:border-[#66D9FF]',
    accent:
      'bg-[#ECFDF3] text-[#067647] border-[#A6F4C5] dark:bg-[#123B30] dark:text-[#6EE7B7] dark:border-[#0F766E] [data-theme=contrast]_&:bg-[#00F084] [data-theme=contrast]_&:text-black [data-theme=contrast]_&:border-[#00F084]',
    success:
      'bg-[#ECFDF3] text-[#067647] border-[#A6F4C5] dark:bg-[#123B30] dark:text-[#6EE7B7] dark:border-[#0F766E] [data-theme=contrast]_&:bg-[#00F084] [data-theme=contrast]_&:text-black [data-theme=contrast]_&:border-[#00F084]',
    warning:
      'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89] dark:bg-[#422C0A] dark:text-[#FCD34D] dark:border-[#78350F] [data-theme=contrast]_&:bg-[#FFE600] [data-theme=contrast]_&:text-black [data-theme=contrast]_&:border-[#FFE600]',
    danger:
      'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA] dark:bg-[#46191D] dark:text-[#FCA5A5] dark:border-[#7F1D1D] [data-theme=contrast]_&:bg-[#FF5A67] [data-theme=contrast]_&:text-black [data-theme=contrast]_&:border-[#FF5A67]',
    info:
      'bg-[#EFF8FB] text-[#0B5575] border-[#BAE6FD] dark:bg-[#102F46] dark:text-[#7DD3FC] dark:border-[#155E75] [data-theme=contrast]_&:bg-[#66D9FF] [data-theme=contrast]_&:text-black [data-theme=contrast]_&:border-[#66D9FF]',
  }

  const defaultIcons = {
    primary: 'play_circle',
    success: 'check_circle',
    accent: 'check_circle',
    warning: 'warning',
    danger: 'cancel',
    info: 'info',
    neutral: null,
  }

  const activeIcon = icon !== undefined ? icon : showIcon ? defaultIcons[variant] : null

  const sizeStyles = {
    sm: 'text-[10px] font-bold px-2 py-0.5 rounded-md gap-1',
    md: 'text-[11px] font-bold px-2.5 py-0.5 rounded-lg gap-1.5',
    pill: 'text-[11px] font-bold px-3 py-1 rounded-full gap-1.5',
  }

  return (
    <span
      className={`inline-flex items-center border leading-none tracking-normal select-none font-bold ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {activeIcon && (
        <span aria-hidden="true" className="material-symbols-outlined text-[13px] shrink-0">
          {activeIcon}
        </span>
      )}
      <span>{children}</span>
    </span>
  )
}

export default Badge
