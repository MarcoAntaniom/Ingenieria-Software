import { forwardRef } from 'react'

export const Button = forwardRef(function Button(
  {
    children,
    type = 'button',
    variant = 'primary', // 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'subtle'
    size = 'md',        // 'sm' (32px) | 'md' (40px) | 'lg' (48px)
    isLoading = false,
    loadingText,
    disabled = false,
    className = '',
    iconLeading,
    iconTrailing,
    ...props
  },
  ref,
) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] focus-visible:ring-offset-2 dark:focus-visible:ring-[#67E8F9] dark:focus-visible:ring-offset-[#0B1220] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'

  const variantStyles = {
    primary:
      'btn-primary bg-[#0B5575] text-white hover:bg-[#074968] active:bg-[#05374F] dark:bg-[#0E7490] dark:hover:bg-[#155E75] dark:active:bg-[#164E63] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black [data-theme=contrast]_&:hover:bg-[#FFD400] [data-theme=contrast]_&:hover:text-black shadow-xs',
    secondary:
      'btn-secondary border border-[#CBD5E1] bg-white text-[#0B5575] hover:bg-[#EFF8FB] hover:border-[#BAE6FD] dark:bg-[#111B2E] dark:text-[#67E8F9] dark:border-[#2A3A52] dark:hover:bg-[#16243A] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:text-white [data-theme=contrast]_&:border-white [data-theme=contrast]_&:hover:bg-[#262626] shadow-xs',
    tertiary:
      'bg-transparent text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#CBD5E1] dark:hover:bg-[#16243A] dark:hover:text-[#F8FAFC] [data-theme=contrast]_&:text-white [data-theme=contrast]_&:hover:bg-[#262626]',
    danger:
      'bg-[#B42318] text-white hover:bg-[#912018] active:bg-[#7A1C15] dark:bg-[#46191D] dark:text-[#FCA5A5] dark:border dark:border-[#7F1D1D] dark:hover:bg-[#7F1D1D] [data-theme=contrast]_&:bg-[#FF5A67] [data-theme=contrast]_&:text-black [data-theme=contrast]_&:hover:bg-[#FFE600] shadow-xs',
    outline:
      'btn-secondary border border-[#CBD5E1] bg-white text-[#0B5575] hover:bg-[#EFF8FB] hover:border-[#BAE6FD] dark:bg-[#111B2E] dark:text-[#67E8F9] dark:border-[#2A3A52] dark:hover:bg-[#16243A] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:text-white [data-theme=contrast]_&:border-white [data-theme=contrast]_&:hover:bg-[#262626] shadow-xs',
    ghost:
      'bg-transparent text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#CBD5E1] dark:hover:bg-[#16243A] dark:hover:text-[#F8FAFC] [data-theme=contrast]_&:text-white [data-theme=contrast]_&:hover:bg-[#262626]',
    subtle:
      'bg-[#EFF8FB] text-[#0B5575] hover:bg-[#DDF2F8] dark:bg-[#123B49] dark:text-[#67E8F9] dark:hover:bg-[#16243A] [data-theme=contrast]_&:bg-[#1A1A1A] [data-theme=contrast]_&:text-[#00B7FF]',
  }

  // Alturas estandarizadas: sm: 32px, md: 40px, lg: 48px
  const sizeStyles = {
    sm: 'text-xs px-3 h-8 min-h-[32px] rounded-md gap-1.5',
    md: 'text-xs sm:text-sm px-4 h-10 min-h-[40px] rounded-lg gap-2',
    lg: 'text-sm sm:text-base px-5 h-12 min-h-[48px] rounded-xl gap-2.5',
  }

  const isBtnDisabled = disabled || isLoading

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
      disabled={isBtnDisabled}
      ref={ref}
      type={type}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0"
          />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {iconLeading && (
            <span aria-hidden="true" className="material-symbols-outlined text-lg shrink-0">
              {iconLeading}
            </span>
          )}
          <span>{children}</span>
          {iconTrailing && (
            <span aria-hidden="true" className="material-symbols-outlined text-lg shrink-0">
              {iconTrailing}
            </span>
          )}
        </>
      )}
    </button>
  )
})

export default Button
