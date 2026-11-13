import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  // Define los archivos donde Tailwind busca clases utilizadas por la aplicación.
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Amplía la paleta con tokens semánticos adaptables al modo oscuro y alto contraste
      colors: {
        app: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          hover: 'var(--color-surface-hover)',
          border: 'var(--color-border)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        brand: {
          primary: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          text: 'var(--color-primary-text)',
          accent: 'var(--color-accent)',
        },
        state: {
          success: 'var(--color-success-text)',
          'success-bg': 'var(--color-success-bg)',
          warning: 'var(--color-warning-text)',
          'warning-bg': 'var(--color-warning-bg)',
          danger: 'var(--color-danger-text)',
          'danger-bg': 'var(--color-danger-bg)',
          info: 'var(--color-info-text)',
          'info-bg': 'var(--color-info-bg)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark, #074968)',
          light: 'var(--color-primary-light, #126A8D)',
          subtle: 'var(--color-primary-subtle, #EFF8FB)',
        },
        secondary: {
          DEFAULT: 'var(--color-accent)',
          dark: '#066B65',
        },
        'accent-gold': 'var(--color-warning)',
        'accent-gold-light': 'var(--color-warning-bg)',
        'border-light': 'var(--color-border)',
        'text-muted': 'var(--color-text-muted)',
        'surface-subtle': 'var(--color-surface-subtle)',
        'text-primary': 'var(--color-text-primary)',
        'canvas-bg': 'var(--color-bg)',
        'surface-card': 'var(--color-surface)',
        surface: 'var(--color-surface)',
        card: 'var(--color-surface)',
        subtle: 'var(--color-surface-subtle)',
        line: 'var(--color-border)',
        ink: 'var(--color-text-primary)',
        muted: 'var(--color-text-muted)',
        danger: {
          DEFAULT: 'var(--color-danger)',
          soft: 'var(--color-danger-bg)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-bg)',
        },
      },
      // Configura la fuente principal del diseño.
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  // Añade estilos de formularios y variantes para consultas de contenedor.
  plugins: [forms, containerQueries],
}
