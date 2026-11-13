import { createContext, useContext, useEffect, useState } from 'react'
import es from '../i18n/translations/es.json'
import arn from '../i18n/translations/arn.json'
import en from '../i18n/translations/en.json'

const TRANSLATIONS = {
  es,
  'es-CL': es,
  arn,
  en,
  'en-US': en,
}

const LANG_HTML_ATTR = {
  es: 'es-CL',
  'es-CL': 'es-CL',
  arn: 'arn-CL',
  en: 'en-US',
  'en-US': 'en-US',
}

export const LANGUAGES = [
  { code: 'es', label: 'Español (es-CL)', short: 'ES', native: 'Español' },
  { code: 'arn', label: 'Mapudungun (arn)', short: 'ARN', native: 'Mapudungun' },
  { code: 'en', label: 'English (en-US)', short: 'EN', native: 'English' },
]

const LanguageContext = createContext({
  language: 'es',
  setLanguage: () => {},
  t: (key, params) => key,
  languages: LANGUAGES,
})

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return 'es'
    const saved = localStorage.getItem('campus-lang')
    if (saved && TRANSLATIONS[saved]) return saved
    return 'es'
  })

  useEffect(() => {
    const htmlLang = LANG_HTML_ATTR[language] || 'es-CL'
    document.documentElement.setAttribute('lang', htmlLang)
    try {
      localStorage.setItem('campus-lang', language)
    } catch {
      // Ignore localStorage restrictions
    }
  }, [language])

  function setLanguage(code) {
    if (TRANSLATIONS[code]) {
      setLanguageState(code)
    }
  }

  function t(path, params = {}) {
    const activeDict = TRANSLATIONS[language] || es
    const fallbackDict = es

    const keys = path.split('.')
    let current = activeDict

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        current = null
        break
      }
    }

    // Fallback to Spanish if not found in active dictionary
    if (current === null || current === undefined) {
      let fb = fallbackDict
      for (const key of keys) {
        if (fb && typeof fb === 'object' && key in fb) {
          fb = fb[key]
        } else {
          fb = null
          break
        }
      }
      current = fb
    }

    if (typeof current !== 'string') {
      return path
    }

    // Interpolation of {param}
    let result = current
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
    }

    return result
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage debe ser utilizado dentro de un LanguageProvider')
  }
  return context
}

export default LanguageContext
