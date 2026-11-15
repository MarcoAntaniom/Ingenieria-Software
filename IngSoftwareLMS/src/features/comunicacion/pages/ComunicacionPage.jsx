import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import { PageHeader } from '../../../shared/components/ui/StateViews'
import {
  createConversacion,
  createMensajeForo,
  createTemaForo,
  fetchAnuncios,
  fetchConversaciones,
  fetchForos,
  fetchForoTemas,
  fetchMensajesDirectos,
  fetchTemaMensajes,
  sendMensajeDirecto,
} from '../api/comunicacionApi'
import { fetchUsuarios } from '../../usuarios/api/usuariosApi'
import ForosExplorer from '../components/ForosExplorer'
import AnunciosWall from '../components/AnunciosWall'
import DirectMessagesPanel from '../components/DirectMessagesPanel'

export default function ComunicacionPage() {
  const [tab, setTab] = useState('foros')
  const [selectedForoId, setSelectedForoId] = useState(null)
  const [selectedTemaId, setSelectedTemaId] = useState(null)
  const [selectedConversacionId, setSelectedConversacionId] = useState(null)

  const queryClient = useQueryClient()

  const forosQuery = useQuery({
    queryKey: queryKeys.comunicacion.foros(),
    queryFn: () => fetchForos(),
  })

  const temasQuery = useQuery({
    queryKey: queryKeys.comunicacion.foroTemas(selectedForoId),
    queryFn: () => fetchForoTemas(selectedForoId),
    enabled: Boolean(selectedForoId),
  })

  const mensajesTemaQuery = useQuery({
    queryKey: queryKeys.comunicacion.temaMensajes(selectedTemaId),
    queryFn: () => fetchTemaMensajes(selectedTemaId),
    enabled: Boolean(selectedTemaId),
  })

  const anunciosQuery = useQuery({
    queryKey: queryKeys.comunicacion.anuncios(),
    queryFn: () => fetchAnuncios(),
  })

  const conversacionesQuery = useQuery({
    queryKey: queryKeys.comunicacion.conversaciones,
    queryFn: fetchConversaciones,
  })

  const directosQuery = useQuery({
    queryKey: queryKeys.comunicacion.mensajesDirectos({
      conversacion: selectedConversacionId,
    }),
    queryFn: () =>
      fetchMensajesDirectos({
        conversacion: selectedConversacionId || undefined,
      }),
  })

  const usuariosQuery = useQuery({
    queryKey: queryKeys.usuarios.all,
    queryFn: fetchUsuarios,
    enabled: tab === 'directos',
  })

  const crearTemaMut = useMutation({
    mutationFn: createTemaForo,
    onSuccess: () => {
      toast.success('Tema publicado en el foro.')
      queryClient.invalidateQueries({
        queryKey: queryKeys.comunicacion.foroTemas(selectedForoId),
      })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const responderTemaMut = useMutation({
    mutationFn: createMensajeForo,
    onSuccess: () => {
      toast.success('Respuesta publicada.')
      queryClient.invalidateQueries({
        queryKey: queryKeys.comunicacion.temaMensajes(selectedTemaId),
      })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const crearConversacionMut = useMutation({
    mutationFn: createConversacion,
    onSuccess: () => {
      toast.success('Conversación creada.')
      queryClient.invalidateQueries({
        queryKey: queryKeys.comunicacion.conversaciones,
      })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const enviarDirectoMut = useMutation({
    mutationFn: sendMensajeDirecto,
    onSuccess: () => {
      toast.success('Mensaje directo enviado (cifrado).')
      queryClient.invalidateQueries({
        queryKey: ['comunicacion', 'mensajes-directos'],
      })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const foros = forosQuery.data || []
  const temas = temasQuery.data || []
  const mensajesTema = mensajesTemaQuery.data || []
  const anuncios = anunciosQuery.data || []
  const conversaciones = conversacionesQuery.data || []
  const mensajesDirectos = directosQuery.data || []

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Comunidad Académica"
        title="Comunicación, Foros y Mensajería"
        description="Participa en hilos de discusión por sección, consulta anuncios oficiales y envía mensajes directos cifrados."
      />

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6 lg:px-10">
        <div className="flex w-max flex-wrap gap-2 rounded-xl border border-line bg-card p-2 shadow-xs">
          {[
            { id: 'foros', label: `Foros y Debates (${foros.length})`, icon: 'forum' },
            {
              id: 'anuncios',
              label: `Muro de Anuncios (${anuncios.length})`,
              icon: 'campaign',
            },
            {
              id: 'directos',
              label: `Mensajes Directos (${mensajesDirectos.length})`,
              icon: 'lock',
            },
          ].map((item) => (
            <button
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                tab === item.id
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-subtle'
              }`}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'foros' && (
          <ForosExplorer
            foros={foros}
            isCreatingTema={crearTemaMut.isPending}
            isLoadingForos={forosQuery.isLoading}
            isReplyingTema={responderTemaMut.isPending}
            mensajesTema={mensajesTema}
            onCreateTema={(payload, reset) =>
              crearTemaMut.mutate(payload, { onSuccess: reset })
            }
            onReplyTema={(payload, reset) =>
              responderTemaMut.mutate(payload, { onSuccess: reset })
            }
            onSelectForo={(foroId) => {
              setSelectedForoId(foroId)
              setSelectedTemaId(null)
            }}
            onToggleTema={(temaId) =>
              setSelectedTemaId((prev) => (prev === temaId ? null : temaId))
            }
            selectedForoId={selectedForoId}
            selectedTemaId={selectedTemaId}
            temas={temas}
          />
        )}

        {tab === 'anuncios' && (
          <AnunciosWall anuncios={anuncios} isLoading={anunciosQuery.isLoading} />
        )}

        {tab === 'directos' && (
          <DirectMessagesPanel
            conversaciones={conversaciones}
            isCreatingConversacion={crearConversacionMut.isPending}
            isLoadingMensajes={directosQuery.isLoading}
            isSendingMessage={enviarDirectoMut.isPending}
            mensajesDirectos={mensajesDirectos}
            onCreateConversacion={(payload, onDone) =>
              crearConversacionMut.mutate(payload, { onSuccess: onDone })
            }
            onSelectConversacion={setSelectedConversacionId}
            onSendMessage={(payload, reset) =>
              enviarDirectoMut.mutate(payload, { onSuccess: reset })
            }
            selectedConversacionId={selectedConversacionId}
            usuarios={usuariosQuery.data || []}
          />
        )}
      </div>
    </div>
  )
}
