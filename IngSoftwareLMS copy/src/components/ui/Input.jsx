export default function Input({
  id,
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label
          className="mb-1.5 block text-sm font-semibold text-ink"
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="min-h-12 w-full rounded-xl border border-line bg-subtle px-4 text-sm text-ink transition placeholder:text-muted focus:border-primary focus:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        id={id}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs font-medium text-danger-strong" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
