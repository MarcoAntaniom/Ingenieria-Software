import { useMemo } from 'react'
import DOMPurify from 'dompurify'

export default function RichText({ html, className = '' }) {
  const cleanHtml = useMemo(() => DOMPurify.sanitize(html || ''), [html])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}
