/**
 * Tokens de diseño centralizados para Campus Virtual LMS
 * Sistema de diseño EdTech con soporte para Modo Oscuro y Alto Contraste (WCAG 2.1 AA/AAA).
 */
export const tokens = {
  colors: {
    // 1. MODO CLARO (Default institucional)
    light: {
      canvas: '#F6F8FB',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      surfaceHover: '#F8FAFC',
      surfaceSubtle: '#F8FAFC',
      border: '#E2E8F0',
      borderSubtle: '#E2E8F0',
      borderHover: '#CBD5E1',
      borderStrong: '#94A3B8',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',

      primary: '#0B5575',
      primaryDark: '#074968',
      primaryLight: '#126A8D',
      primarySubtle: '#EFF8FB',
      primaryButtonBg: '#0B5575',
      primaryButtonText: '#FFFFFF',

      accent: '#087F78',
      accentHover: '#066B65',
      accentLight: '#14B8A6',
      accentText: '#067647',
      accentButton: '#087F78',

      success: '#067647',
      successBg: '#ECFDF3',
      successText: '#067647',
      successBorder: '#A6F4C5',

      warning: '#B54708',
      warningBg: '#FFFAEB',
      warningText: '#B54708',
      warningBorder: '#FEDF89',

      danger: '#B42318',
      dangerBg: '#FEF3F2',
      dangerText: '#B42318',
      dangerBorder: '#FECDCA',

      info: '#0B5575',
      infoBg: '#EFF8FB',
      infoText: '#0B5575',
      infoBorder: '#BAE6FD',

      selectionBg: '#EFF8FB',
      selectionText: '#0B5575',

      focus: '#0B5575',
      progressTrack: '#E2E8F0',
      progressFill: '#0B5575',
    },

    // 2. MODO OSCURO (Azul grafito profundo institucional - Confort visual y profundidad)
    dark: {
      canvas: '#0B1220',
      surface: '#111B2E',
      sidebar: '#0F192A',
      surface2: '#16243A',
      surface3: '#1D2F46',
      surfaceElevated: '#16243A',
      surfaceHover: '#1D2F46',
      surfaceSubtle: '#0B1220',

      border: '#2A3A52',
      borderSubtle: '#2A3A52',
      borderHover: '#5D718B',
      borderStrong: '#5D718B',

      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',

      primary: '#0E7490',
      primaryDark: '#155E75',
      primaryHover: '#155E75',
      primaryActive: '#164E63',
      primaryLight: '#67E8F9',
      primaryText: '#67E8F9',
      primarySubtle: '#123B49',
      primaryButtonBg: '#0E7490',
      primaryButtonText: '#FFFFFF',

      accent: '#14B8A6',
      accentHover: '#115E59',
      accentLight: '#5EEAD4',
      accentText: '#5EEAD4',
      accentDark: '#0F766E',
      accentButton: '#0F766E',

      success: '#6EE7B7',
      successBg: '#123B30',
      successText: '#6EE7B7',
      successBorder: '#0F766E',

      warning: '#FCD34D',
      warningBg: '#422C0A',
      warningText: '#FCD34D',
      warningBorder: '#78350F',

      danger: '#FCA5A5',
      dangerBg: '#46191D',
      dangerText: '#FCA5A5',
      dangerBorder: '#7F1D1D',

      info: '#7DD3FC',
      infoBg: '#102F46',
      infoText: '#7DD3FC',
      infoBorder: '#155E75',

      selectionBg: '#123B49',
      selectionText: '#67E8F9',

      focus: '#67E8F9',
      progressTrack: '#2A3A52',
      progressFill: '#2DD4BF',
    },

    // 3. MODO CONTRASTE ALTO (Accesibilidad WCAG 2.1 AA/AAA - 3 niveles de borde, sin saturación)
    contrast: {
      canvas: '#000000',
      surface: '#0D0D0D',
      sidebar: '#0D0D0D',
      surface2: '#1A1A1A',
      surface3: '#262626',
      surfaceElevated: '#1A1A1A',
      surfaceHover: '#262626',
      surfaceSubtle: '#000000',

      border: '#A6A6A6',
      borderMuted: '#A6A6A6',
      borderSubtle: '#A6A6A6',
      borderHover: '#FFFFFF',
      borderStrong: '#FFFFFF',

      textPrimary: '#FFFFFF',
      textSecondary: '#F2F2F2',
      textMuted: '#D9D9D9',

      primary: '#00B7FF',
      primaryHover: '#66D9FF',
      primaryText: '#66D9FF',
      primarySubtle: '#1A1A1A',
      primaryButtonBg: '#FFFFFF',
      primaryButtonText: '#000000',
      secondaryButtonBg: '#000000',
      secondaryButtonText: '#FFFFFF',

      accent: '#00F084',
      warning: '#FFE600',
      danger: '#FF5A67',
      info: '#66D9FF',

      success: '#00F084',
      successBg: '#00F084',
      successText: '#000000',
      successBorder: '#00F084',

      warningBg: '#FFE600',
      warningText: '#000000',
      warningBorder: '#FFE600',

      dangerBg: '#FF5A67',
      dangerText: '#000000',
      dangerBorder: '#FF5A67',

      infoBg: '#66D9FF',
      infoText: '#000000',
      infoBorder: '#66D9FF',

      selectionBg: '#1A1A1A',
      selectionText: '#00B7FF',

      focus: '#FFD400',
      progressTrack: '#000000',
      progressFill: '#00F084',
    },

      success: '#00F084',
      successBg: '#0D0D0D',
      successText: '#00F084',
      successBorder: '#00F084',

      warning: '#FFE600',
      warningBg: '#0D0D0D',
      warningText: '#FFE600',
      warningBorder: '#FFE600',

      danger: '#FF4D5A',
      dangerBg: '#0D0D0D',
      dangerText: '#FF4D5A',
      dangerBorder: '#FF4D5A',

      info: '#66D9FF',
      infoBg: '#0D0D0D',
      infoText: '#66D9FF',
      infoBorder: '#66D9FF',

      selectionBg: '#1A1A1A',
      selectionText: '#00B7FF',

      focus: '#FFD400',
      progressTrack: '#000000',
      progressFill: '#00B7FF',
    },
  },

  radius: {
    sm: 'rounded-[6px]',
    md: 'rounded-[8px]',
    lg: 'rounded-[12px]',
    xl: 'rounded-[16px]',
    pill: 'rounded-full',
  },

  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },

  shadows: {
    card: 'shadow-[0_3px_12px_rgba(15,23,42,0.06)] dark:shadow-none dark:border dark:border-[#2F4058]',
    cardHover: 'shadow-[0_6px_18px_rgba(15,23,42,0.1)] dark:shadow-none',
    dialog: 'shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:shadow-none dark:border dark:border-[#2F4058]',
    dropdown: 'shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12)] dark:shadow-none dark:border dark:border-[#2F4058]',
  },
}

export default tokens
