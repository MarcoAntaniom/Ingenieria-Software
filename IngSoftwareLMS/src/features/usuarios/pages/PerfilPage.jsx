import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/auth-context'
import { PageHeader } from '../../../shared/components/ui/StateViews'
import { extractApiError } from '../../../shared/lib/pagination'
import { getRoleLabel } from '../../../shared/lib/roles'
import ProfileDetailsCard from '../components/ProfileDetailsCard'

export default function PerfilPage() {
  const { user, refreshProfile } = useAuth()
  const [isSyncing, setIsSyncing] = useState(false)

  async function handleSync() {
    setIsSyncing(true)
    try {
      await refreshProfile()
      toast.success('Perfil sincronizado con el servidor.')
    } catch (err) {
      toast.error(extractApiError(err, 'No se pudo sincronizar el perfil.'))
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Cuenta Institucional"
        title="Mi Perfil"
        badge={getRoleLabel(user)}
        description="Información de identidad verificada mediante token JWT en el backend."
        actions={
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
            disabled={isSyncing}
            onClick={handleSync}
            type="button"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              sync
            </span>
            {isSyncing ? 'Sincronizando...' : 'Actualizar desde /usuarios/me/'}
          </button>
        }
      />

      <div className="mx-auto w-full max-w-[1360px] px-6 py-6 lg:px-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ProfileDetailsCard user={user} />
        </div>
      </div>
    </div>
  )
}
