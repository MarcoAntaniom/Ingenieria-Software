export default function AppFooter({ roleLabel }) {
  return (
    <footer className="border-t border-line bg-card py-4 text-xs text-muted">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-2 px-6 lg:px-10">
        <p>
          <strong className="text-ink">Campus Virtual LMS</strong> · Ingeniería de Software
        </p>
        <p>Sesión activa como {roleLabel}</p>
      </div>
    </footer>
  )
}
