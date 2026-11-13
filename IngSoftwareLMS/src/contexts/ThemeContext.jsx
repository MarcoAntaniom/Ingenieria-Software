import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  isContrast: false,
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('campus-theme')
    if (saved === 'dark' || saved === 'light' || saved === 'contrast') return saved
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })

  const isDark = theme === 'dark'
  const isContrast = theme === 'contrast'

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)

    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('contrast-mode')
    } else if (theme === 'contrast') {
      root.classList.add('dark')
      root.classList.add('contrast-mode')
    } else {
      root.classList.remove('dark')
      root.classList.remove('contrast-mode')
    }

    try {
      localStorage.setItem('campus-theme', theme)
    } catch {
      // Ignore localStorage restrictions
    }
  }, [theme])

  function setTheme(newTheme) {
    if (newTheme === 'dark' || newTheme === 'light' || newTheme === 'contrast') {
      setThemeState(newTheme)
    }
  }

  function toggleTheme() {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'contrast'
      return 'light'
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, isContrast, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider')
  }
  return context
}

export default ThemeContext
