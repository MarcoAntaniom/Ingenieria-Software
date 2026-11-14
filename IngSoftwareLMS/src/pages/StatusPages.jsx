import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

function StatusPage({ code, title, description, action }) {
  return (
    <main className="grid min-h-screen place-items-center bg-surface p-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-secondary">
          {code}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-primary">{title}</h1>
        <p className="mt-3 text-sm text-muted">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </Card>
    </main>
  )
}

export function PermissionDeniedPage() {
  const navigate = useNavigate()
  return (
    <StatusPage
      action={<Button onClick={() => navigate(-1)}>Volver</Button>}
      code="403"
      description="Tu cuenta no tiene permiso para ver este contenido."
      title="Sin permiso"
    />
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <StatusPage
      action={<Button onClick={() => navigate('/')}>Ir al inicio</Button>}
      code="404"
      description="La dirección solicitada no existe."
      title="Página no encontrada"
    />
  )
}
