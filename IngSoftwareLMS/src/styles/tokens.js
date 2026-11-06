/**
 * Tokens de diseño centralizados para Campus Virtual LMS
 * Garantiza consistencia visual, jerarquía controlada y cumplimiento WCAG AA.
 */
export const tokens = {
  colors: {
    // Color primario de marca (Azul institucional)
    primary: '#075477',
    primaryHover: '#064563',
    primarySubtle: '#E8F3F8',
    primaryFocus: 'rgba(7, 84, 119, 0.25)',

    // Color de acción y acento (Teal)
    accent: '#14b8a6',
    accentHover: '#0d9488',
    accentSubtle: '#E6FAF8',

    // Estados funcionales (Contraste accesible)
    success: '#16856a',
    successBg: '#F0FDF4',
    successBorder: '#BBF7D0',

    warning: '#b7791f',
    warningBg: '#FEFCE8',
    warningBorder: '#FEF08A',

    danger: '#c53030',
    dangerBg: '#FEF2F2',
    dangerBorder: '#FECACA',

    info: '#0284c7',
    infoBg: '#F0F9FF',
    infoBorder: '#BAE6FD',

    // Neutros de superficie, fondo y tipografía
    text: '#172033',          // Texto principal (WCAG AAA)
    muted: '#64748b',         // Texto secundario legible (WCAG AA > 4.5:1)
    mutedLight: '#94a3b8',    // Metadatos accesibles
    surface: '#ffffff',       // Superficie de tarjetas y modales
    canvas: '#f5f7fb',        // Fondo general de la plataforma
    border: '#dbe3ec',        // Bordes suaves
    borderHover: '#cbd5e1',   // Borde al pasar cursor
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    pageTitle: 'text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#172033]',
    sectionTitle: 'text-lg sm:text-xl font-bold tracking-tight text-[#172033]',
    cardTitle: 'text-base sm:text-[17px] font-bold leading-snug text-[#172033]',
    body: 'text-sm text-[#172033] leading-relaxed',
    secondary: 'text-xs text-[#64748b] leading-normal',
    metadata: 'text-[11px] sm:text-xs text-[#64748b] font-medium',
  },
  shadows: {
    card: 'shadow-[0_3px_12px_rgba(15,23,42,0.06)]',
    cardHover: 'shadow-[0_6px_18px_rgba(15,23,42,0.1)]',
    dialog: 'shadow-[0_18px_50px_rgba(15,23,42,0.18)]',
    dropdown: 'shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12),0_8px_10px_-6px_rgba(15,23,42,0.06)]',
  },
  radius: {
    sm: 'rounded-[6px]',
    md: 'rounded-[10px]',
    lg: 'rounded-[14px]',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  },
}
