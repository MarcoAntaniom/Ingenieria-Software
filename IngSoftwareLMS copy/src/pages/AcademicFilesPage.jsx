import AppShell from '../components/layout/AppShell'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'

export default function AcademicFilesPage() {
  return (
    <AppShell>
      <section className="mx-auto flex max-w-[1000px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-dark">
            Gestión documental
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
            Archivos académicos
          </h1>
          <p className="mt-1 text-sm text-muted">
            Repositorio de documentos PDF, DOCX y ZIP.
          </p>
        </header>
        <Card className="p-6">
          <EmptyState
            description="La API actual lista, sube y elimina archivos sin asociarlos a un propietario ni comprobar permisos. El repositorio permanecerá deshabilitado hasta que el backend aísle los documentos por usuario."
            icon="folder_open"
            title="Repositorio pendiente de permisos backend"
          />
        </Card>
      </section>
    </AppShell>
  )
}
