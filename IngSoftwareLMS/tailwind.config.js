import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  // Define los archivos donde Tailwind busca clases utilizadas por la aplicación.
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Amplía la paleta predeterminada con los colores de la interfaz.
      colors: {
        primary: '#0b486b',
        'primary-dark': '#072f46',
        secondary: '#169b9b',
        'secondary-dark': '#0f7777',
        'accent-gold': '#df9d36',
        'accent-gold-light': '#fef3d6',
        'accent-gold-dark': '#b77c22',
        'surface-tint': '#0b486b',
        'border-light': '#E2E8F0',
        'text-muted': '#64748B',
        'surface-subtle': '#F5F8FA',
        'text-primary': '#0F172A',
        'canvas-bg': '#f5f8fa',
        'surface-card': '#FFFFFF',
        surface: '#f8f9ff',
        card: '#FFFFFF',
        subtle: '#F1F5F9',
        line: '#E2E8F0',
        ink: '#0F172A',
        muted: '#64748B',
        danger: '#EF4444',
        'danger-soft': '#FEE2E2',
        'primary-container': '#104c64',
        'secondary-container': '#8cf5e4',
        'secondary-fixed': '#8cf5e4',
        'on-secondary-container': '#007166',
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
