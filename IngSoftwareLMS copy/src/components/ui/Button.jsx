const VARIANTS = {
  primary:
    'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary',
  secondary:
    'border border-line bg-card text-primary hover:bg-subtle focus-visible:ring-secondary',
  danger:
    'bg-danger-strong text-white hover:brightness-95 focus-visible:ring-danger-strong',
}

export default function Button({
  children,
  className = '',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
