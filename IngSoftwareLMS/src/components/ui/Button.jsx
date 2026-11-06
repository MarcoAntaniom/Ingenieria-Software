import { forwardRef } from 'react'

export const Button = forwardRef(function Button(
  {
    children,
    type = 'button',
    variant = 'primary', // 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'subtle'
    size = 'md',        // 'sm' | 'md' | 'lg'
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
  // Estilos base unificados con alto de 40-44px para el tamaño md
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#075477] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'

  const variantStyles = {
    // Primario: Fondo azul institucional, texto blanco, alto 40-44px
    primary:
      'bg-[#075477] text-white hover:bg-[#064563] shadow-xs active:bg-[#05374f]',
    // Secundario: Fondo blanco/gris claro, borde sutil, texto azul institucional
    secondary:
      'border border-[#dbe3ec] bg-white text-[#075477] hover:bg-[#f5f7fb] hover:border-[#cbd5e1] shadow-xs active:bg-[#e2e8f0]',
    // Terciario: Sin fondo fuerte, texto legible con contraste suficiente, sin borde
    tertiary:
      'bg-transparent text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033] active:bg-[#e2e8f0]',
    // Peligro / Advertencia: Para acciones críticas (eliminar, atrasos)
    danger:
      'bg-[#c53030] text-white hover:bg-[#9b2c2c] shadow-xs active:bg-[#742a2a]',
    // Alias para compatibilidad con código existente
    outline:
      'border border-[#dbe3ec] bg-white text-[#075477] hover:bg-[#f5f7fb] hover:border-[#cbd5e1] active:bg-[#e2e8f0]',
    ghost:
      'bg-transparent text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033] active:bg-[#e2e8f0]',
    subtle:
      'bg-[#E8F3F8] text-[#075477] hover:bg-[#d6eaf3] active:bg-[#c2e0ee]',
  }

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-[8px] gap-1.5 min-h-[34px]',
    md: 'text-xs sm:text-sm px-4 py-2.5 rounded-[10px] gap-2 min-h-[42px]', // 40-44px
    lg: 'text-sm sm:text-base px-5 py-3 rounded-[12px] gap-2.5 min-h-[48px]',
  }

  const isBtnDisabled = disabled || isLoading

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
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
