export default function Card({ as: Element = 'section', className = '', ...props }) {
  return (
    <Element
      className={`rounded-xl border border-line bg-card shadow-sm ${className}`}
      {...props}
    />
  )
}
