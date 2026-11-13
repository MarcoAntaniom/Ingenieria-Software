import { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  {
    id,
    label,
    error,
    helperText,
    type = 'text',
    className = '',
    iconLeading,
    iconTrailing,
    disabled = false,
    required = false,
    ...props
  },
  ref,
) {
  const errorId = id ? `${id}-error` : undefined
  const helperId = id ? `${id}-helper` : undefined

  return (
    <div className="w-full">
      {label && (
        <label
          className="mb-1.5 block text-xs font-bold text-[#1F2937] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white"
          htmlFor={id}
        >
          {label} {required && <span className="text-[#C53030]">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {iconLeading && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined pointer-events-none absolute left-3.5 text-lg text-[#64748B]"
          >
            {iconLeading}
          </span>
        )}

        <input
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#1F2937] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] [data-theme=contrast]_&:placeholder:text-[#A6A6A6] transition-all duration-150 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8FAFC] dark:disabled:bg-[#111B2E] disabled:text-[#94A3B8] ${
            iconLeading ? 'pl-10' : ''
          } ${iconTrailing ? 'pr-10' : ''} ${
            error
              ? 'border-[#C53030] dark:border-[#FCA5A5] [data-theme=contrast]_&:border-[#FF5A67] focus:border-[#C53030] focus:ring-[#C53030]/20'
              : 'border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] hover:border-[#CBD5E1] dark:hover:border-[#5D718B] focus:border-[#0B4F6C] dark:focus:border-[#67E8F9] [data-theme=contrast]_&:focus:border-[#FFFFFF] [data-theme=contrast]_&:focus:ring-2 [data-theme=contrast]_&:focus:ring-[#FFD400]'
          } ${className}`}
          disabled={disabled}
          id={id}
          ref={ref}
          required={required}
          type={type}
          {...props}
        />

        {iconTrailing && (
          <div className="absolute right-3.5 flex items-center">{iconTrailing}</div>
        )}
      </div>

      {error ? (
        <p
          className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#C53030]"
          id={errorId}
          role="alert"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-sm">
            error
          </span>
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#64748B]" id={helperId}>
          {helperText}
        </p>
      ) : null}
    </div>
  )
})
