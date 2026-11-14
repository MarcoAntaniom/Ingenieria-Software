import AppShell from '../components/layout/AppShell'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'

export default function ModulePage({ module }) {
  return (
    <AppShell>
      <section className="mx-auto max-w-[1360px] px-6 py-8 lg:px-10">
        <h1 className="mb-5 text-2xl font-extrabold tracking-tight text-primary">
          {module.title}
        </h1>
        <Card className="p-6">
          <EmptyState
            description="El backend aún no publica el endpoint necesario. Esta pantalla no carga ni genera datos de ejemplo."
            icon="construction"
            title="Módulo no disponible"
          />
        </Card>
      </section>
    </AppShell>
  )
}
