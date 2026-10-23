import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Configura Vite para compilar React y procesar las utilidades de Tailwind.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
