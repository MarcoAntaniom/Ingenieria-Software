import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmarEnvioEntrega,
  fetchTareaById,
  fetchTareas,
  fetchTodasLasEntregasTareas,
} from '../../services/academico'

export function useTareas(page = 1) {
  return useQuery({
    queryKey: ['academico', 'tareas', page],
    queryFn: ({ signal }) => fetchTareas(page, { signal }),
    placeholderData: (previousData) => previousData,
  })
}

export function useTareaDetail(tareaId) {
  return useQuery({
    queryKey: ['academico', 'tarea', String(tareaId)],
    queryFn: ({ signal }) => fetchTareaById(tareaId, { signal }),
    enabled: Boolean(tareaId),
  })
}

export function useTodasLasEntregasTareas() {
  return useQuery({
    queryKey: ['academico', 'entregas-tareas', 'todas'],
    queryFn: ({ signal }) => fetchTodasLasEntregasTareas({ signal }),
  })
}

export function useConfirmarEnvio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: confirmarEnvioEntrega,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['academico', 'entregas-tareas'],
      }),
  })
}
