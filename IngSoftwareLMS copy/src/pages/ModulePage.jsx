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
            description={module.blocker || 'Falta confirmar un contrato de backend seguro para esta función.'}
            icon="pending_actions"
            title="Función pendiente del backend"
          />
        </Card>
      </section>
    </AppShell>
  )
}
